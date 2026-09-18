import { Repository } from 'typeorm';
import { Socket } from 'socket.io';
import { UserConected } from '../../../entities/UserConected.entity';
export declare class SocketRegistryService {
    private readonly userConectedRepository;
    constructor(userConectedRepository: Repository<UserConected>);
    registerSocket(client: Socket, userId: string, userName: string, namespace: string, clientData?: Record<string, any>): Promise<UserConected>;
    removeSocket(socketId: string): Promise<boolean>;
    getUserSockets(userId: string, namespace: string): Promise<UserConected[]>;
    getUsersSockets(userIds: string[], namespace: string): Promise<UserConected[]>;
    isSocketRegistered(socketId: string): Promise<boolean>;
}
