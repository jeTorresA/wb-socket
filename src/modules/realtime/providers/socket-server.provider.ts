import { Injectable, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';

/**
 * Provider abstracto para servidor Socket.IO
 * Permite desacoplar la instancia del servidor y preparar para clustering
 */
@Injectable()
export class SocketServerProvider implements OnModuleInit {
  private server: Server;

  onModuleInit() {
    // Inicialización diferida - el servidor se configura desde el gateway
  }

  /**
   * Configura la instancia del servidor Socket.IO
   */
  setServer(server: Server): void {
    this.server = server;
  }

  /**
   * Obtiene la instancia del servidor Socket.IO
   */
  getServer(): Server {
    if (!this.server) {
      throw new Error('Socket.IO server no ha sido inicializado');
    }
    return this.server;
  }

  /**
   * Verifica si el servidor está inicializado
   */
  isInitialized(): boolean {
    return !!this.server;
  }

  /**
   * Obtiene un namespace específico
   */
  getNamespace(namespace: string) {
    return this.getServer().of(`/${namespace}`);
  }

  /**
   * Emite un evento a un namespace específico
   */
  emitToNamespace(namespace: string, event: string, data: any): void {
    this.getNamespace(namespace).emit(event, data);
  }

  /**
   * Emite un evento a rooms específicas en un namespace
   */
  emitToRooms(namespace: string, rooms: string[], event: string, data: any): void {
    const ns = this.getNamespace(namespace);
    rooms.forEach(room => {
      ns.to(room).emit(event, data);
    });
  }

  /**
   * Emite un evento a usuarios específicos en un namespace
   */
  emitToUsers(namespace: string, users: string[], event: string, data: any): void {
    const ns = this.getNamespace(namespace);
    users.forEach(userId => {
      ns.to(`user:${userId}`).emit(event, data);
    });
  }
}
