import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketServerProvider, SocketRegistryService, IssuerJwtService } from 'src/modules/realtime';
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    private readonly socketServerProvider;
    private readonly socketRegistryService;
    private readonly issuerJwtService;
    server: Server;
    constructor(socketServerProvider: SocketServerProvider, socketRegistryService: SocketRegistryService, issuerJwtService: IssuerJwtService);
    afterInit(server: Server): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): Promise<void>;
    userConect(client: Socket): Promise<void>;
    eventMarkedDone(client: Socket, eventId: string | number): Promise<void>;
    emitToUser(userId: string, event: string, data: any): void;
    emitToUserName(userName: string, event: string, data: any): void;
}
