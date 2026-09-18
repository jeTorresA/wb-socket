import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ChatMessagesHandler } from './handlers/chat.messages.handler';
import { ChatRoomsHandler } from './handlers/chat.rooms.handler';
import { ChatFilesHandler } from './handlers/chat.files.handler';
import { SocketServerProvider, SocketRegistryService, IssuerJwtService, TokenIdentity } from 'src/modules/realtime';
import { mensajes, salasChat, suscriptor } from './interfaces/chat/chat.interface';

/**
 * Gateway orquestador para chat
 * Delega lógica funcional a handlers especializados
 */
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer() server: Server = new Server();

  constructor(
    private readonly chatService: ChatService,
    private readonly messagesHandler: ChatMessagesHandler,
    private readonly roomsHandler: ChatRoomsHandler,
    private readonly filesHandler: ChatFilesHandler,
    private readonly socketServerProvider: SocketServerProvider,
    private readonly socketRegistryService: SocketRegistryService,
    private readonly issuerJwtService: IssuerJwtService,
  ) {}

  afterInit(server: Server) {
    // Obtener el servidor raíz desde el namespace
    const rootServer = (server as any).server;
    this.socketServerProvider.setServer(rootServer);

    // Validar el JWT de la plataforma emisora en el handshake (multi-emisor)
    this.server.use(this.issuerJwtService.middleware());
  }

  handleConnection(client: Socket, user_id: string) {
    console.info('USUARIO CONECTADO ', { client_id: client.id, user_id });
  }

  async handleDisconnect(client: Socket) {
    try {
      await this.socketRegistryService.removeSocket(client.id);
    } catch (error) {
      console.error('NO FUE POSIBLE ELIMINAR EL CLIENTE DESCONECTADO DE LA LISTA ', error);
    }
  }

  @SubscribeMessage('userConected')
  async userConect(
    @ConnectedSocket() client: Socket,
  ) {
    // La identidad SIEMPRE se deriva del payload firmado del token (middleware de handshake)
    const identity: TokenIdentity | undefined = client.data?.identity;
    if (!identity) return;

    // Ids calificados por emisor: evitan colisiones de ids entre plataformas
    const { userId, userName } = this.issuerJwtService.qualify(identity);

    await this.socketRegistryService.registerSocket(
      client,
      userId,
      userName,
      'chat',
      {
        issuer: identity.issuer,
        handshake: client.handshake,
        rooms: Array.from(client.rooms),
        connected: client.connected,
      }
    );
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() params: { id_user: string; salasActuales: string[] },
  ) {
    await this.roomsHandler.handleJoinRoom(client, params);
  }

  @SubscribeMessage('joinMessages')
  async handleJoinMensajesSalas(@ConnectedSocket() client: Socket, @MessageBody() id_sala: string) {
    setTimeout(async () => {
      await this.messagesHandler.handleJoinMessages(client, id_sala);
    }, 100);
  }

  @SubscribeMessage('createRoom')
  async handleCreateSala(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: salasChat & { suscriptores: suscriptor[] },
  ) {
    await this.roomsHandler.handleCreateRoom(this.server, client, data);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: mensajes) {
    await this.messagesHandler.handleSendMessage(this.server, data);
  }

  @SubscribeMessage('setMessagesAsRead')
  async handleSetMessagesAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { id_sala: string; id_user: string },
  ) {
    await this.messagesHandler.handleSetMessagesAsRead(this.server, data);
  }

  @SubscribeMessage('getFile')
  async handleGetFile(
    @MessageBody('data') data: { fileName: string; location: string },
    @ConnectedSocket() client: Socket,
  ) {
    await this.filesHandler.handleGetFile(client, data);
  }

  // Método público para uso externo
  uploadFile(file: ArrayBuffer, fileName: string, fileMimeType: string) {
    return this.filesHandler.uploadFile(file, fileName, fileMimeType);
  }

  // Método público para verificar cliente activo
  isClientActive(socketId: string): boolean {
    return this.server.sockets.sockets.has(socketId);
  }

  // Método público para emitir a un usuario usando room global
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Métodos públicos para compatibilidad con código existente
  async verifyConnectedClients(roomType: number, room: any[]) {
    await this.roomsHandler.subscribeClients(this.server, roomType, room);
  }

  async subscribeClientsToRoom(room: any, clients: any[], roomType: number) {
    await this.roomsHandler['subscribeClientsToRoom'](this.server, room, clients, roomType);
  }

  async unsubscribeClientsFromRoom(room: any, clients: any[], roomType: number) {
    this.roomsHandler.unsubscribeClientsFromRoom(this.server, room, clients, roomType);
  }
}
