import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { PublishEventDto } from '../dto/publish-event.dto';
import { SocketServerProvider } from '../providers/socket-server.provider';

/**
 * Servicio despachador de eventos realtime
 * Maneja la distribución de eventos a través de namespaces dinámicos
 */
@Injectable()
export class EventDispatcherService {
  constructor(private readonly socketServerProvider: SocketServerProvider) {}

  /**
   * Configura la instancia del servidor Socket.IO
   * @deprecated Usar SocketServerProvider.setServer() directamente
   */
  setServer(server: Server): void {
    this.socketServerProvider.setServer(server);
  }

  /**
   * Obtiene un namespace dinámicamente
   */
  getNamespace(namespace: string) {
    return this.socketServerProvider.getNamespace(namespace);
  }

  /**
   * Emite eventos a rooms específicas en un namespace
   */
  emitToRooms(namespace: string, rooms: string[], event: string, payload: any): void {
    this.socketServerProvider.emitToRooms(namespace, rooms, event, payload);
  }

  /**
   * Emite eventos a usuarios específicos en un namespace
   * Usa rooms globales (user:${userId}) sin consultar base de datos
   */
  emitToUsers(namespace: string, users: string[], event: string, payload: any): void {
    this.socketServerProvider.emitToUsers(namespace, users, event, payload);
  }

  /**
   * Publica un evento según la configuración del DTO
   */
  publish(dto: PublishEventDto): void {
    if (dto.rooms && dto.rooms.length > 0) {
      this.emitToRooms(dto.namespace, dto.rooms, dto.event, dto.payload);
    }

    if (dto.users && dto.users.length > 0) {
      this.emitToUsers(dto.namespace, dto.users, dto.event, dto.payload);
    }
  }
}
