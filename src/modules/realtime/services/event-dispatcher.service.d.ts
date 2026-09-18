import { Server } from 'socket.io';
import { PublishEventDto } from '../dto/publish-event.dto';
import { SocketServerProvider } from '../providers/socket-server.provider';
export declare class EventDispatcherService {
    private readonly socketServerProvider;
    constructor(socketServerProvider: SocketServerProvider);
    setServer(server: Server): void;
    getNamespace(namespace: string): import("socket.io").Namespace<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
    emitToRooms(namespace: string, rooms: string[], event: string, payload: any): void;
    emitToUsers(namespace: string, users: string[], event: string, payload: any): void;
    publish(dto: PublishEventDto): void;
}
