import { EventDispatcherService } from '../services/event-dispatcher.service';
export declare class NotificationService {
    private readonly eventDispatcher;
    constructor(eventDispatcher: EventDispatcherService);
    notifyMessageCreated(roomId: string, message: any): void;
    notifyUsers(userIds: string[], notification: any): void;
    broadcastEvent(rooms: string[], users: string[], eventData: any): void;
}
