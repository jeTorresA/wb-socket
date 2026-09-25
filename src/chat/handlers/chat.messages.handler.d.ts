import { Server } from 'socket.io';
import { ChatService } from '../chat.service';
import { mensajes } from '../interfaces/chat/chat.interface';
import { IssuerJwtService, TokenIdentity } from 'src/modules/realtime';
export declare class ChatMessagesHandler {
    private readonly chatService;
    private readonly issuerJwtService;
    constructor(chatService: ChatService, issuerJwtService: IssuerJwtService);
    handleSendMessage(server: Server, data: mensajes, identity?: TokenIdentity): Promise<any>;
    handleSetMessagesAsRead(server: Server, data: {
        id_sala: string;
        id_user: string;
    }, identity?: TokenIdentity): Promise<void>;
    handleJoinMessages(client: any, id_sala: string): Promise<void>;
}
