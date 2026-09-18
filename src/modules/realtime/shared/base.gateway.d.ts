import { Server, Socket } from 'socket.io';
export declare abstract class BaseGateway {
    protected server: Server;
    protected registerUserRoom(client: Socket, userId: string): void;
    protected emitToUsers(namespace: string, users: string[], event: string, payload: any): void;
    protected emitToRooms(namespace: string, rooms: string[], event: string, payload: any): void;
    protected isSocketActive(socketId: string): boolean;
    protected isSocketActiveInNamespace(namespace: string, socketId: string): boolean;
}
