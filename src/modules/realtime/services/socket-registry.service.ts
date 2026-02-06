import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { UserConected } from '../../../entities/UserConected.entity';

/**
 * Servicio centralizado para gestión de sockets conectados
 * Maneja registro, eliminación y consulta de sockets por usuario y namespace
 */
@Injectable()
export class SocketRegistryService {
  constructor(
    @InjectRepository(UserConected)
    private readonly userConectedRepository: Repository<UserConected>,
  ) {}

  /**
   * Registra un socket conectado y lo une al room global del usuario
   */
  async registerSocket(
    client: Socket,
    userId: string,
    userName: string,
    namespace: string,
    clientData?: Record<string, any>,
  ): Promise<UserConected> {
    // Unir al room global del usuario
    const userRoom = `user:${userId}`;
    if (!client.rooms.has(userRoom)) {
      client.join(userRoom);
    }

    const userConected = this.userConectedRepository.create({
      userId,
      userName,
      namespace,
      client: {
        id: client.id,
        ...clientData,
      },
    });

    return await this.userConectedRepository.save(userConected);
  }

  /**
   * Elimina un socket por su ID
   */
  async removeSocket(socketId: string): Promise<boolean> {
    const result = await this.userConectedRepository.delete({
      client: { id: socketId } as any,
    });

    return result.affected > 0;
  }

  /**
   * Obtiene todos los sockets de un usuario en un namespace específico
   */
  async getUserSockets(userId: string, namespace: string): Promise<UserConected[]> {
    return await this.userConectedRepository.find({
      where: {
        userId,
        namespace,
      },
    });
  }

  /**
   * Obtiene todos los sockets de múltiples usuarios en un namespace
   */
  async getUsersSockets(userIds: string[], namespace: string): Promise<UserConected[]> {
    if (userIds.length === 0) return [];

    return await this.userConectedRepository
      .createQueryBuilder('uc')
      .where('uc.userId IN (:...userIds)', { userIds })
      .andWhere('uc.namespace = :namespace', { namespace })
      .getMany();
  }

  /**
   * Verifica si un socket está registrado
   */
  async isSocketRegistered(socketId: string): Promise<boolean> {
    const count = await this.userConectedRepository
      .createQueryBuilder('uc')
      .where("JSON_EXTRACT(uc.client, '$.id') = :socketId", { socketId })
      .getCount();

    return count > 0;
  }
}
