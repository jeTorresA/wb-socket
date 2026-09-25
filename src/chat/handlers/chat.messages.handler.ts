import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { ChatService } from '../chat.service';
import { mensajes } from '../interfaces/chat/chat.interface';
import { IssuerJwtService, TokenIdentity } from 'src/modules/realtime';

/**
 * Handler especializado para gestión de mensajes de chat
 */
@Injectable()
export class ChatMessagesHandler {
  constructor(
    private readonly chatService: ChatService,
    private readonly issuerJwtService: IssuerJwtService,
  ) {}

  async handleSendMessage(server: Server, data: mensajes, identity?: TokenIdentity) {
    const message = await this.chatService.createMensaje(data);
    await this.chatService.updateMessagesToRead(data.id_sala, data.id_user);

    // El emisor sale del token del socket; los id_user del chat son crudos (sin emisor),
    // por lo que se califican para apuntar a las rooms globales `user:<iss>:<id>`
    const issuer = identity?.issuer;
    if (!issuer) {
      console.warn('MENSAJE SIN IDENTIDAD: no fue posible notificar en tiempo real', { id_sala: data.id_sala });
      return message;
    }

    // Notificar al remitente usando su room global
    const senderRoom = `user:${this.issuerJwtService.qualifyUserId(issuer, data.id_user)}`;
    server.to(senderRoom).emit('sentMessage', message);

    // Notificar a otros suscriptores usando rooms globales
    const roomSubscribers = await this.chatService.getRoomSubscribers(data.id_sala);
    const subscribersToNotify = roomSubscribers
      .filter(sub => sub.id_user !== data.id_user)
      .map(sub => sub.id_user);

    subscribersToNotify.forEach(userId => {
      const subscriberRoom = `user:${this.issuerJwtService.qualifyUserId(issuer, userId)}`;
      server.to(subscriberRoom).emit('newMessage', message);
    });

    return message;
  }

  async handleSetMessagesAsRead(server: Server, data: { id_sala: string; id_user: string }, identity?: TokenIdentity) {
    await this.chatService.updateMessagesAsRead(data.id_sala, data.id_user);

    const issuer = identity?.issuer;
    if (!issuer) return;

    const userRoom = `user:${this.issuerJwtService.qualifyUserId(issuer, data.id_user)}`;
    server.to(userRoom).emit('messagesRead', data);
  }

  async handleJoinMessages(client: any, id_sala: string) {
    const messages = await this.chatService.obtenerMensajesSala(id_sala);
    client.emit('mensajesSala', messages);
  }
}
