import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ChatMessagesHandler } from './handlers/chat.messages.handler';
import { ChatRoomsHandler } from './handlers/chat.rooms.handler';
import { ChatFilesHandler } from './handlers/chat.files.handler';
import { SocketServerProvider, SocketRegistryService, IssuerJwtService } from 'src/modules/realtime';
import { mensajes, salasChat, suscriptor } from './interfaces/chat/chat.interface';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    private readonly chatService;
    private readonly messagesHandler;
    private readonly roomsHandler;
    private readonly filesHandler;
    private readonly socketServerProvider;
    private readonly socketRegistryService;
    private readonly issuerJwtService;
    server: Server;
    constructor(chatService: ChatService, messagesHandler: ChatMessagesHandler, roomsHandler: ChatRoomsHandler, filesHandler: ChatFilesHandler, socketServerProvider: SocketServerProvider, socketRegistryService: SocketRegistryService, issuerJwtService: IssuerJwtService);
    afterInit(server: Server): void;
    handleConnection(client: Socket, user_id: string): void;
    handleDisconnect(client: Socket): Promise<void>;
    userConect(client: Socket): Promise<void>;
    handleJoinRoom(client: Socket, params: {
        id_user: string;
        salasActuales: string[];
    }): Promise<void>;
    handleJoinMensajesSalas(client: Socket, id_sala: string): Promise<void>;
    handleCreateSala(client: Socket, data: salasChat & {
        suscriptores: suscriptor[];
    }): Promise<void>;
    handleMessage(client: Socket, data: mensajes): Promise<void>;
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
    emitToUser(userId: string, event: string, data: any): void;
    verifyConnectedClients(roomType: number, room: any[]): Promise<void>;
    subscribeClientsToRoom(room: any, clients: any[], roomType: number): Promise<void>;
    unsubscribeClientsFromRoom(room: any, clients: any[], roomType: number): Promise<void>;
}
