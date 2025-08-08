import { Controller, Post, Res, HttpStatus, Body, Req } from '@nestjs/common';
import { Request, Response } from 'express';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChatService } from 'src/chat/chat.service';

@Controller('api')
export class ApiController {
    constructor (
        private readonly chatGateway: ChatGateway,
        private readonly chatService: ChatService
    ) {}

    @Post('send-notification')
    async sendNotification(
        @Body() data: { notification: string, type: string, context: { user_name: string; data: any }[] },
        @Res() res: Response
    ) {
        console.log('DATA RECIBIDA PARA sendNotification ', data);       
        
        const userNames = data.context.map(item => (item.user_name));

        if(userNames.length !== 0) {
            const userClients = await this.chatService.searchClientsConnectedByUserName(userNames);

            if(userClients.length !== 0) {
                userClients.forEach(client => {
                    const _data = data.context.find(item => item.user_name === client.userName);
        
                    this.chatGateway.emitEventToClient(
                        client,
                        'sentNotification',
                        {
                            notification: data.notification,
                            type: data.type,
                            data: _data
                        }
                    );
                })
            }
        }
        
        return res.status(HttpStatus.ACCEPTED).json({ status: true, message: 'Las notificaciones han sido aceptadas para enviarse' });
    }
    @Post('request-status')
    // sendRequestStatusNotification(@Body() data: { actual_status: string, next_status: string, all_status: string[]|null }) {
    sendRequestStatusNotification(@Req() request: Request) {
        const data = request.body;
        console.log('DATA RECIBIDA PARA sendRequestStatusNotification ', data);
        
        // Obtener el servidor de sockets
        const io = request['app']['io'];

        if (!io) {
            console.error('Socket.io no está inicializado');
            return { error: 'WebSocket no disponible' };
        }

        // Emitir evento solo al usuario específico
        const usuarioId = '31-r3Fyu8IhHqKL8AAAB';
        io.to(usuarioId).emit('requestStatus', data);

        return { status: 'Notificación enviada' };
    }   
}