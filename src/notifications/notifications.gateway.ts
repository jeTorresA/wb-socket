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
import { SocketServerProvider, SocketRegistryService, IssuerJwtService, TokenIdentity } from 'src/modules/realtime';

@WebSocketGateway({ namespace: '/notifications' })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer() server: Server = new Server();

  constructor(
    private readonly socketServerProvider: SocketServerProvider,
    private readonly socketRegistryService: SocketRegistryService,
    private readonly issuerJwtService: IssuerJwtService,
  ) {}

  afterInit(server: Server) {
    const rootServer = (server as any).server;
    if (!this.socketServerProvider.isInitialized()) {
      this.socketServerProvider.setServer(rootServer);
    }

    // Validar el JWT de la plataforma emisora en el handshake (multi-emisor)
    this.server.use(this.issuerJwtService.middleware());
  }

  handleConnection(client: Socket) {
    console.info('USUARIO CONECTADO A NOTIFICATIONS', { client_id: client.id });
  }

  async handleDisconnect(client: Socket) {
    try {
      await this.socketRegistryService.removeSocket(client.id);
    } catch (error) {
      console.error('ERROR AL DESCONECTAR CLIENTE DE NOTIFICATIONS', error);
    }
  }

  @SubscribeMessage('userConected')
  async userConect(
    @ConnectedSocket() client: Socket,
  ) {
    // La identidad SIEMPRE se deriva del payload firmado del token (middleware de handshake)
    const identity: TokenIdentity | undefined = client.data?.identity;
    if (!identity) return;

    // Rooms calificadas por emisor: evitan colisiones de ids entre plataformas
    const { userId, userName } = this.issuerJwtService.qualify(identity);

    // Unir al cliente a la sala por nombre de usuario (para emisiones dirigidas por user_name)
    const userNameRoom = `userName:${userName}`;
    if (!client.rooms.has(userNameRoom)) {
      client.join(userNameRoom);
    }

    await this.socketRegistryService.registerSocket(
      client,
      userId,
      userName,
      'notifications',
      {
        issuer: identity.issuer,
        handshake: client.handshake,
        rooms: Array.from(client.rooms),
        connected: client.connected,
      }
    );
  }

  @SubscribeMessage('eventMarkedDone')
  async eventMarkedDone(
    @ConnectedSocket() client: Socket,
    @MessageBody('eventId') eventId: string | number,
  ) {
    const identity: TokenIdentity | undefined = client.data?.identity;
    if (!identity) return;

    console.info('EVENTO MARCADO COMO CUMPLIDO', { identity, eventId });

    // Relay a todas las pestañas/dispositivos del mismo usuario (mismo emisor)
    const { userId } = this.issuerJwtService.qualify(identity);
    this.emitToUser(userId, 'eventMarkedDone', { eventId });
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToUserName(userName: string, event: string, data: any) {
    this.server.to(`userName:${userName}`).emit(event, data);
  }
}
