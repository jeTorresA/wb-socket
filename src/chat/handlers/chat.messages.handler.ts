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

  /**
   * Guarda un mensaje y notifica al emisor ('sentMessage') y a los demás suscriptores ('newMessage').
   * El emisor se toma SIEMPRE del token firmado del socket (no del payload) y debe ser suscriptor
   * activo de la sala; en caso contrario el mensaje se descarta.
   * @param server Servidor del namespace /chat.
   * @param data Mensaje enviado por el cliente (su id_user se ignora y se reemplaza por el del token).
   * @param identity Identidad derivada del token en el handshake.
   * @returns El mensaje guardado, o undefined si fue rechazado.
   */
  async handleSendMessage(server: Server, data: mensajes, identity?: TokenIdentity) {
    if (!identity) {
      console.warn('MENSAJE RECHAZADO (socket sin identidad)', { id_sala: data?.id_sala });
      return;
    }

    // Los id_user del chat son crudos (sin emisor); el del token también lo es
    const senderId = identity.userId;
    const roomSubscribers = await this.chatService.getRoomSubscribers(data.id_sala);
    if (!roomSubscribers.some(sub => sub.id_user === senderId)) {
      console.warn('MENSAJE RECHAZADO (el emisor no pertenece a la sala)', { id_sala: data.id_sala, id_user: senderId });
      return;
    }

    const message = await this.chatService.createMensaje({ ...data, id_user: senderId });
    await this.chatService.updateMessagesToRead(data.id_sala, senderId);

    // Se califican los ids para apuntar a las rooms globales `user:<iss>:<id>`
    const issuer = identity.issuer;

    // Notificar al remitente usando su room global
    const senderRoom = `user:${this.issuerJwtService.qualifyUserId(issuer, senderId)}`;
    server.to(senderRoom).emit('sentMessage', message);

    // Notificar a otros suscriptores usando rooms globales
    const subscribersToNotify = roomSubscribers
      .filter(sub => sub.id_user !== senderId)
      .map(sub => sub.id_user);

    subscribersToNotify.forEach(userId => {
      const subscriberRoom = `user:${this.issuerJwtService.qualifyUserId(issuer, userId)}`;
      server.to(subscriberRoom).emit('newMessage', message);
    });

    return message;
  }

  /**
   * Marca como leídos los mensajes de una sala para el usuario del token y notifica a sus pestañas.
   * El lector se toma SIEMPRE del token firmado del socket: un cliente no puede marcar como leídos
   * los mensajes de otro usuario.
   * @param server Servidor del namespace /chat.
   * @param data Sala a marcar (el id_user del payload se ignora).
   * @param identity Identidad derivada del token en el handshake.
   */
  async handleSetMessagesAsRead(server: Server, data: { id_sala: string; id_user?: string }, identity?: TokenIdentity) {
    if (!identity) return;

    const readerId = identity.userId;
    await this.chatService.updateMessagesAsRead(data.id_sala, readerId);

    const userRoom = `user:${this.issuerJwtService.qualifyUserId(identity.issuer, readerId)}`;
    server.to(userRoom).emit('messagesRead', { id_sala: data.id_sala, id_user: readerId });
  }

  /**
   * Envía al cliente el historial de una sala, solo si el usuario del token es suscriptor activo.
   * En caso contrario responde una lista vacía (el cliente espera 'mensajesSala' para continuar).
   * @param client Socket del cliente (con la identidad fijada en el handshake).
   * @param id_sala Sala cuyo historial se solicita.
   */
  async handleJoinMessages(client: any, id_sala: string) {
    const identity: TokenIdentity | undefined = client.data?.identity;
    if (!identity || !(await this.chatService.isActiveSubscriber(id_sala, identity.userId))) {
      console.warn('HISTORIAL RECHAZADO (el usuario no pertenece a la sala)', { id_sala, id_user: identity?.userId });
      client.emit('mensajesSala', []);
      return;
    }

    const messages = await this.chatService.obtenerMensajesSala(id_sala);
    client.emit('mensajesSala', messages);
  }
}
