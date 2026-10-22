import { Request, Response } from 'express';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChatService } from 'src/chat/chat.service';
import { IssuerJwtService, TokenIdentity } from 'src/modules/realtime';
import { salasChat, suscriptor } from 'src/chat/interfaces/chat/chat.interface';
export declare class RoomsController {
    private readonly chatGateway;
    private readonly chatService;
    private readonly issuerJwtService;
    constructor(chatGateway: ChatGateway, chatService: ChatService, issuerJwtService: IssuerJwtService);
    handleGetSalas(salaId: string, req: Request & {
        identity: TokenIdentity;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    handlePutRoom(idSala: string, data: (salasChat & {
        suscriptores: suscriptor[];
    }), req: Request & {
        identity: TokenIdentity;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    handleDeleteRoom(idSala: string, req: Request & {
        identity: TokenIdentity;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
}
