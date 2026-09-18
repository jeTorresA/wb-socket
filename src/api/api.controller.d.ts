import { Request, Response } from 'express';
import { ChatGateway } from 'src/chat/chat.gateway';
import { SocketServerProvider } from 'src/modules/realtime';
export declare class ApiController {
    private readonly chatGateway;
    private readonly socketServerProvider;
    constructor(chatGateway: ChatGateway, socketServerProvider: SocketServerProvider);
    sendNotification(data: {
        notification: string;
        type: string;
        issuer?: string;
        context: {
            user_name: string;
            data: any;
        }[];
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    sendNotificationAllUsers(data: {
        notification: string;
        type: string;
        context: any;
    }, res: Response): Promise<Response<any, Record<string, any>>>;
    sendRequestStatusNotification(request: Request): {
        error: string;
        status?: undefined;
    } | {
        status: string;
        error?: undefined;
    };
}
