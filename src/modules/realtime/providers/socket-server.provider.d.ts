import { OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
export declare class SocketServerProvider implements OnModuleInit {
    private server;
    onModuleInit(): void;
    setServer(server: Server): void;
    getServer(): Server;
    isInitialized(): boolean;
    getNamespace(namespace: string): import("socket.io").Namespace<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
    emitToNamespace(namespace: string, event: string, data: any): void;
    emitToRooms(namespace: string, rooms: string[], event: string, data: any): void;
    emitToUsers(namespace: string, users: string[], event: string, data: any): void;
}
