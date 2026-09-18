import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { mensajes, salasChat, suscriptor } from './interfaces/chat/chat.interface';
import { SuscriptoresSalasChat } from 'src/entities/SuscriptoresSalasChat.entity';
import { UserConected } from 'src/entities/UserConected.entity';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    constructor(chatService: ChatService);
    handleConnection(client: Socket, user_id: string): void;
    handleDisconnect(client: any): Promise<void>;
    server: Server;
    userConect(userId: string, userName: string, client: Socket): Promise<void>;
    handleJoinRoom(client: Socket, params: {
        id_user: string;
        salasActuales: string[];
    }): Promise<void>;
    handleJoinMensajesSalas(client: Socket, id_sala: string): Promise<void>;
    handleCreateSala(client: Socket, data: (salasChat & {
        suscriptores: suscriptor[];
    })): Promise<void>;
    verifyConnectedClients(roomType: number, room: (suscriptor & SuscriptoresSalasChat)[]): Promise<void>;
    subscribeClientsToRoom(room: SuscriptoresSalasChat, clients: UserConected[], roomType: number): Promise<void>;
    unsubscribeClientsFromRoom(room: SuscriptoresSalasChat, clients: UserConected[], roomType: number): Promise<void>;
    handleMessage(client: Socket, data: mensajes): Promise<void>;
    emitEventToClient(client: UserConected, event: string, data: any): Promise<void>;
    handleSetMessagesAsRead(client: Socket, data: {
        id_sala: string;
        id_user: string;
    }): Promise<void>;
    handleGetFile(data: {
        fileName: string;
        location: string;
    }, client: Socket): Promise<void>;
    uploadFile(file: ArrayBuffer, fileName: string, fileMimeType: string): {
        status: boolean;
        fileName: string | null;
        fileLocation: string | null;
        mimeType: string | null;
    };
    isClientActive(socketId: string): boolean;
}
