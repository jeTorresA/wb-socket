import { Controller, Post, Res, HttpStatus, Body, Req } from '@nestjs/common';
import { Request, Response } from 'express';
import { ChatGateway } from 'src/chat/chat.gateway';
import { SocketServerProvider } from 'src/modules/realtime';

@Controller('api')
export class ApiController {
    constructor (
        private readonly chatGateway: ChatGateway,
        private readonly socketServerProvider: SocketServerProvider,
    ) {}

    @Post('send-notification')
    async sendNotification(
        @Body() data: { notification: string, type: string, context: { user_name: string; data: any }[] },
        @Res() res: Response
    ) {        
        const userNames = data.context.map(item => item.user_name);

        if(userNames.length !== 0) {
            // Emitir usando rooms globales por userName (si se necesita)
            // O convertir userNames a userIds y usar emitToUsers
            data.context.forEach(item => {
                this.socketServerProvider.getServer().emit('sentNotification', {
                    notification: data.notification,
                    type: data.type,
                    data: item
                });
            });
        }
        
        return res.status(HttpStatus.ACCEPTED).json({ status: true, message: 'Las notificaciones han sido aceptadas para enviarse' });
    }

    @Post('send-notification/all-users')
    async sendNotificationAllUsers(
        @Body() data: { notification: string, type: string, context: any },
        @Res() res: Response
    ) {
        // Broadcast a todos los clientes conectados
        this.socketServerProvider.getServer().emit('sentNotification', {
            notification: data.notification,
            type: data.type,
            data: data.context ?? null
        });
        
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