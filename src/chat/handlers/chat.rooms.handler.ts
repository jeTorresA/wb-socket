import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat.service';
import { SocketRegistryService } from 'src/modules/realtime';
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
  ) {}

  async handleJoinRoom(client: Socket, params: { id_user: string; salasActuales: string[] }) {
    const salasSuscritas = await this.chatService.obtenerSalasSuscritas(
      params.id_user,
      params.salasActuales,
    );

    if (salasSuscritas.length > 0) {
      salasSuscritas.forEach(data => {
        client.join(data.salas.nombre_sala);
        (data as any).mensajes = [];
      });
      client.emit('joinedRooms', salasSuscritas);
    }
  }

  async handleCreateRoom(
    server: Server,
    client: Socket,
    data: salasChat & { suscriptores: suscriptor[] },
  ) {
    const result = await this.chatService.createSala(data);

    if (result.type === 'warning') {
      client.emit('advertencia', result.message);
      return;
    }

    const subscribers = result.data.subscribers as SuscriptoresSalasChat[];
    const principalSubscriber = subscribers.filter(sub => sub.id_user === data.creador);
    const otherSubscribers = subscribers.filter(sub => sub.id_user !== data.creador);

    await this.subscribeClients(server, result.data.tipo_sala, principalSubscriber);
    await this.subscribeClients(server, result.data.tipo_sala, otherSubscribers);
  }

  async subscribeClients(server: Server, roomType: number, subscribers: SuscriptoresSalasChat[]) {
    if (subscribers.length === 0) return;

    const userIds = subscribers.map(sub => sub.id_user);
    const connectedClients = await this.socketRegistryService.getUsersSockets(userIds, 'chat');

    this.subscribeClientsToRoom(server, subscribers[0], connectedClients, roomType);

    // Notificar a TODOS los usuarios usando rooms globales
    userIds.forEach(userId => {
      server.to(`user:${userId}`).emit('newSala', { ...subscribers[0], tipo: roomType });
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
