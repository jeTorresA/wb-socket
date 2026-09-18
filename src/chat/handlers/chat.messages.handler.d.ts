import { Server } from 'socket.io';
import { ChatService } from '../chat.service';
import { mensajes } from '../interfaces/chat/chat.interface';
export declare class ChatMessagesHandler {
    private readonly chatService;
    constructor(chatService: ChatService);
    handleSendMessage(server: Server, data: mensajes): Promise<any>;
    handleSetMessagesAsRead(server: Server, data: {
        id_sala: string;
        id_user: string;
    }): Promise<void>;
    handleJoinMessages(client: any, id_sala: string): Promise<void>;
}
