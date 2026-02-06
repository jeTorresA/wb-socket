import { Injectable } from '@nestjs/common';
import { EventDispatcherService } from '../services/event-dispatcher.service';
import { PublishEventDto } from '../dto/publish-event.dto';

/**
 * Ejemplo de servicio usando EventDispatcherService
 * Demuestra cómo emitir eventos desde servicios de negocio
 */
@Injectable()
export class NotificationService {
  constructor(private readonly eventDispatcher: EventDispatcherService) {}

  /**
   * Ejemplo: Notificar creación de mensaje
   */
  notifyMessageCreated(roomId: string, message: any): void {
    const event: PublishEventDto = {
      namespace: 'chat',
      event: 'message.created',
      rooms: [roomId],
      payload: message,
    };

    this.eventDispatcher.publish(event);
  }

  /**
   * Ejemplo: Notificar a usuarios específicos
   */
  notifyUsers(userIds: string[], notification: any): void {
    const event: PublishEventDto = {
      namespace: 'notifications',
      event: 'notification.new',
      users: userIds,
      payload: notification,
    };

    this.eventDispatcher.publish(event);
  }

  /**
   * Ejemplo: Broadcast a múltiples rooms y usuarios
   */
  broadcastEvent(rooms: string[], users: string[], eventData: any): void {
    const event: PublishEventDto = {
      namespace: 'chat',
      event: 'message.broadcast',
      rooms,
      users,
      payload: eventData,
    };

    this.eventDispatcher.publish(event);
  }
}
