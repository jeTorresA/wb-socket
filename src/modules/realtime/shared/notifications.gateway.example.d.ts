import { Server } from 'socket.io';
import { BaseGateway } from '../shared/base.gateway';
export declare class NotificationsGateway extends BaseGateway {
    server: Server;
    sendNotificationToUsers(users: string[], notification: any): void;
    sendNotificationToRooms(rooms: string[], notification: any): void;
}
