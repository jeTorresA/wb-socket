import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { BaseGateway } from '../shared/base.gateway';

/**
 * Ejemplo de gateway extendiendo BaseGateway
 * Demuestra cómo crear nuevos namespaces sin modificar código existente
 */
@WebSocketGateway({ namespace: '/notifications' })
export class NotificationsGateway extends BaseGateway {
  @WebSocketServer()
  server: Server;

  /**
   * Ejemplo: Enviar notificación a usuarios específicos
   */
  sendNotificationToUsers(users: string[], notification: any): void {
    this.emitToUsers('notifications', users, 'notification.new', notification);
  }

  /**
   * Ejemplo: Enviar notificación a rooms específicas
   */
  sendNotificationToRooms(rooms: string[], notification: any): void {
    this.emitToRooms('notifications', rooms, 'notification.broadcast', notification);
  }
}
