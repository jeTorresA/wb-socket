import { Server, Socket } from 'socket.io';
import { ChatService } from '../chat.service';
import { IssuerJwtService, SocketRegistryService, TokenIdentity } from 'src/modules/realtime';
import { SuscriptoresSalasChat } from 'src/entities/SuscriptoresSalasChat.entity';
import { salasChat, suscriptor } from '../interfaces/chat/chat.interface';
export declare class ChatRoomsHandler {
    private readonly chatService;
    private readonly socketRegistryService;
    private readonly issuerJwtService;
    constructor(chatService: ChatService, socketRegistryService: SocketRegistryService, issuerJwtService: IssuerJwtService);
    handleJoinRoom(client: Socket, params: {
        id_user: string;
        salasActuales: string[];
    }): Promise<void>;
    handleCreateRoom(server: Server, client: Socket, data: salasChat & {
        suscriptores: suscriptor[];
    }, identity?: TokenIdentity): Promise<void>;
    subscribeClients(server: Server, roomType: number, subscribers: SuscriptoresSalasChat[], identity?: TokenIdentity): Promise<void>;
    private subscribeClientsToRoom;
    unsubscribeClientsFromRoom(server: Server, room: SuscriptoresSalasChat, clients: any[], roomType: number): void;
}
