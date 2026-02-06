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
import { SocketServerProvider, SocketRegistryService } from 'src/modules/realtime';

@WebSocketGateway({ namespace: '/notifications' })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer() server: Server = new Server();

  constructor(
    private readonly socketServerProvider: SocketServerProvider,
    private readonly socketRegistryService: SocketRegistryService,
  ) {}

  afterInit(server: Server) {
    const rootServer = (server as any).server;
    if (!this.socketServerProvider.isInitialized()) {
      this.socketServerProvider.setServer(rootServer);
    }
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
    @MessageBody('userId') userId: string,
    @MessageBody('userName') userName: string,
    @ConnectedSocket() client: Socket,
  ) {
    await this.socketRegistryService.registerSocket(
      client,
      userId,
      userName,
      'notifications',
      {
        handshake: client.handshake,
        rooms: Array.from(client.rooms),
        connected: client.connected,
      }
    );
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
