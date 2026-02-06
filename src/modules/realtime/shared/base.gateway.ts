import { Server, Socket } from 'socket.io';

/**
 * Gateway base reutilizable para namespaces realtime
 * Proporciona utilidades comunes para emisión de eventos y registro automático en rooms
 */
export abstract class BaseGateway {
  protected server: Server;

  /**
   * Registra un socket en el room global del usuario
   * Formato: user:${userId}
   */
  protected registerUserRoom(client: Socket, userId: string): void {
    const userRoom = `user:${userId}`;
    if (!client.rooms.has(userRoom)) {
      client.join(userRoom);
    }
  }

  /**
   * Emite un evento a usuarios específicos usando rooms globales
   * No requiere consulta a base de datos
   */
  protected emitToUsers(namespace: string, users: string[], event: string, payload: any): void {
    const ns = this.server.of(`/${namespace}`);
    users.forEach(userId => {
      ns.to(`user:${userId}`).emit(event, payload);
    });
  }

  /**
   * Emite un evento a rooms específicas en un namespace
   */
  protected emitToRooms(namespace: string, rooms: string[], event: string, payload: any): void {
    const ns = this.server.of(`/${namespace}`);
    rooms.forEach(room => {
      ns.to(room).emit(event, payload);
    });
  }

  /**
   * Verifica si un socket está activo
   */
  protected isSocketActive(socketId: string): boolean {
    return this.server.sockets.sockets.has(socketId);
  }

  /**
   * Verifica si un socket está activo en un namespace específico
   */
  protected isSocketActiveInNamespace(namespace: string, socketId: string): boolean {
    const ns = this.server.of(`/${namespace}`);
    return ns.sockets.has(socketId);
  }
}
