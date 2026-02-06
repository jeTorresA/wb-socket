import { Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketRegistryService } from '../services/socket-registry.service';
import { EventDispatcherService } from '../services/event-dispatcher.service';
import { BaseGateway } from './base.gateway';

/**
 * Ejemplo de integración completa
 * Demuestra cómo usar SocketRegistryService y EventDispatcherService juntos
 */
@WebSocketGateway({ namespace: '/example' })
export class IntegrationExampleGateway extends BaseGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly socketRegistry: SocketRegistryService,
    private readonly eventDispatcher: EventDispatcherService,
  ) {
    super();
  }

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const userName = client.handshake.query.userName as string;

    // Registrar socket en el namespace y unir al room global user:userId
    await this.socketRegistry.registerSocket(
      client,
      userId,
      userName,
      'example',
      {
        handshake: client.handshake,
        connected: true,
        connectedAt: new Date(),
      },
    );

    // Notificar a otros usuarios usando rooms globales (sin consulta DB)
    this.eventDispatcher.publish({
      namespace: 'example',
      event: 'user.connected',
      users: ['user-1', 'user-2'], // Emite a user:user-1 y user:user-2
      payload: { userId, userName },
    });
  }

  async handleDisconnect(client: Socket) {
    // Eliminar socket del registro
    await this.socketRegistry.removeSocket(client.id);

    // Notificar desconexión
    this.eventDispatcher.publish({
      namespace: 'example',
      event: 'user.disconnected',
      rooms: ['lobby'],
      payload: { socketId: client.id },
    });
  }

  /**
   * Ejemplo: Enviar mensaje a un usuario usando room global (sin consulta DB)
   */
  async sendToUser(userId: string, message: any) {
    // Emite directamente al room user:userId sin consultar base de datos
    this.eventDispatcher.publish({
      namespace: 'example',
      event: 'message.received',
      users: [userId],
      payload: message,
    });
  }

  /**
   * Ejemplo: Broadcast a múltiples usuarios usando rooms globales
   */
  async broadcastToUsers(userIds: string[], event: string, payload: any) {
    // Emite a múltiples rooms user:userId sin consultar base de datos
    this.eventDispatcher.publish({
      namespace: 'example',
      event,
      users: userIds,
      payload,
    });
  }
}
