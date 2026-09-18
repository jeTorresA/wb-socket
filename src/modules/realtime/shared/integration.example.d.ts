import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketRegistryService } from '../services/socket-registry.service';
import { EventDispatcherService } from '../services/event-dispatcher.service';
import { BaseGateway } from './base.gateway';
export declare class IntegrationExampleGateway extends BaseGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly socketRegistry;
    private readonly eventDispatcher;
    server: Server;
    constructor(socketRegistry: SocketRegistryService, eventDispatcher: EventDispatcherService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): Promise<void>;
    sendToUser(userId: string, message: any): Promise<void>;
    broadcastToUsers(userIds: string[], event: string, payload: any): Promise<void>;
}
