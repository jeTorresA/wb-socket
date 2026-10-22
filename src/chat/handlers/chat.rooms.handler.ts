import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat.service';
import { IssuerJwtService, SocketRegistryService, TokenIdentity } from 'src/modules/realtime';
import { SuscriptoresSalasChat } from 'src/entities/SuscriptoresSalasChat.entity';
import { salasChat, suscriptor } from '../interfaces/chat/chat.interface';

/**
 * Handler especializado para gestión de salas de chat
 */
@Injectable()
export class ChatRoomsHandler {
  constructor(
    private readonly chatService: ChatService,
    private readonly socketRegistryService: SocketRegistryService,
    private readonly issuerJwtService: IssuerJwtService,
  ) {}

  /**
   * Devuelve las salas suscritas del usuario del token y une el socket a ellas.
   * El usuario se toma SIEMPRE del token firmado del socket (no del payload), para que un cliente
   * no pueda consultar las salas de otro usuario.
   * @param client Socket del cliente (con la identidad fijada en el handshake).
   * @param params Salas que el cliente ya conoce (el id_user del payload se ignora).
   */
  async handleJoinRoom(client: Socket, params: { id_user?: string; salasActuales: string[] }) {
    const identity: TokenIdentity | undefined = client.data?.identity;
    if (!identity) return;

    const salasSuscritas = await this.chatService.obtenerSalasSuscritas(
      identity.userId,
      params?.salasActuales ?? [],
    );

    if (salasSuscritas.length > 0) {
      salasSuscritas.forEach(data => {
        client.join(data.salas.nombre_sala);
        (data as any).mensajes = [];
      });
      client.emit('joinedRooms', salasSuscritas);
    }
  }

  /**
   * Crea una sala (o reutiliza un chat 1 a 1) y notifica a sus participantes.
   * El creador es SIEMPRE el usuario del token firmado del socket (el `creador` del payload se ignora).
   * @param server Servidor del namespace /chat.
   * @param client Socket del cliente que crea la sala.
   * @param data Datos de la sala y suscriptores enviados por el cliente.
   * @param identity Identidad derivada del token en el handshake.
   */
  async handleCreateRoom(
    server: Server,
    client: Socket,
    data: salasChat & { suscriptores: suscriptor[] },
    identity?: TokenIdentity,
  ) {
    if (!identity) {
      client.emit('advertencia', 'No fue posible identificar al usuario');
      return;
    }

    const creatorId = identity.userId;
    const result = await this.chatService.createSala(data, creatorId, !!identity.isAdmin);

    if (result.type === 'warning') {
      client.emit('advertencia', result.message);
      return;
    }

    const subscribers = result.data.subscribers as SuscriptoresSalasChat[];
    const principalSubscriber = subscribers.filter(sub => sub.id_user === creatorId);
    const otherSubscribers = subscribers.filter(sub => sub.id_user !== creatorId);

    await this.subscribeClients(server, result.data.tipo_sala, principalSubscriber, identity);
    await this.subscribeClients(server, result.data.tipo_sala, otherSubscribers, identity);
  }

  async subscribeClients(
    server: Server,
    roomType: number,
    subscribers: SuscriptoresSalasChat[],
    identity?: TokenIdentity,
  ) {
    if (subscribers.length === 0) return;

    // Los id_user del chat son crudos; se califican para las rooms globales `user:<iss>:<id>`
    const issuer = identity?.issuer ?? 'repotencia';
    const userIds = subscribers.map(sub => sub.id_user);
    const qualifiedUserIds = userIds.map(userId => this.issuerJwtService.qualifyUserId(issuer, userId));
    const connectedClients = await this.socketRegistryService.getUsersSockets(qualifiedUserIds, 'chat');

    this.subscribeClientsToRoom(server, subscribers[0], connectedClients, roomType);

    // Notificar a cada usuario con SU propia suscripción (nombre/avatar/contador correctos)
    subscribers.forEach(sub => {
      const userRoom = `user:${this.issuerJwtService.qualifyUserId(issuer, sub.id_user)}`;
      server.to(userRoom).emit('newSala', { ...sub, tipo: roomType });
    });
  }

  private subscribeClientsToRoom(
    server: Server,
    room: SuscriptoresSalasChat,
    clients: any[],
    roomType: number,
  ) {
    clients.forEach((client: any) => {
      const socket = (server as any).sockets.get(client.client.id);
      if (socket) {
        socket.join(room.id_sala);
        socket.emit('salaSuscrita', { ...room, tipo: roomType });
      } else {
        this.socketRegistryService.removeSocket(client.client.id);
      }
    });
  }

  unsubscribeClientsFromRoom(
    server: Server,
    room: SuscriptoresSalasChat,
    clients: any[],
    roomType: number,
  ) {
    clients.forEach((client: any) => {
      const socket = (server as any).sockets.get(client.client.id);
      if (socket) {
        socket.leave(room.id_sala);
        socket.emit('salaEliminada', { ...room, tipo: roomType });
      } else {
        this.socketRegistryService.removeSocket(client.client.id);
      }
    });
  }
}
