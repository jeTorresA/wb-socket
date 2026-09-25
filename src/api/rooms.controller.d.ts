import { Response } from 'express';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChatService } from 'src/chat/chat.service';
import { IssuerJwtService } from 'src/modules/realtime';
import { salasChat, suscriptor } from 'src/chat/interfaces/chat/chat.interface';
export declare class RoomsController {
    private readonly chatGateway;
    private readonly chatService;
    private readonly issuerJwtService;
    constructor(chatGateway: ChatGateway, chatService: ChatService, issuerJwtService: IssuerJwtService);
    handleGetSalas(salaId: string, res: Response): Promise<Response<any, Record<string, any>>>;
    handlePutRoom(idSala: string, data: (salasChat & {
        suscriptores: suscriptor[];
    }), res: Response): Promise<Response<any, Record<string, any>>>;
    handleDeleteRoom(idSala: string, res: Response): Promise<Response<any, Record<string, any>>>;
}
