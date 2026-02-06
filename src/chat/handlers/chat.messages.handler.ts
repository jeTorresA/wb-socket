import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { ChatService } from '../chat.service';
import { mensajes } from '../interfaces/chat/chat.interface';

/**
 * Handler especializado para gestión de mensajes de chat
 */
@Injectable()
export class ChatMessagesHandler {
  constructor(
    private readonly chatService: ChatService,
  ) {}

  async handleSendMessage(server: Server, data: mensajes) {
    const message = await this.chatService.createMensaje(data);
    await this.chatService.updateMessagesToRead(data.id_sala, data.id_user);

    // Notificar al remitente usando room global
    server.to(`user:${data.id_user}`).emit('sentMessage', message);

    // Notificar a otros suscriptores usando rooms globales
    const roomSubscribers = await this.chatService.getRoomSubscribers(data.id_sala);
    const subscribersToNotify = roomSubscribers
      .filter(sub => sub.id_user !== data.id_user)
      .map(sub => sub.id_user);

    if (subscribersToNotify.length > 0) {
      subscribersToNotify.forEach(userId => {
        server.to(`user:${userId}`).emit('newMessage', message);
      });
    }

    return message;
  }

  async handleSetMessagesAsRead(server: Server, data: { id_sala: string; id_user: string }) {
    await this.chatService.updateMessagesAsRead(data.id_sala, data.id_user);
    server.to(`user:${data.id_user}`).emit('messagesRead', data);
  }

  async handleJoinMessages(client: any, id_sala: string) {
    const messages = await this.chatService.obtenerMensajesSala(id_sala);
    client.emit('mensajesSala', messages);
  }
}
