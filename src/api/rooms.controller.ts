import { Controller, Post, Res, HttpStatus, Body, Req, Get, Query, Put, Param } from '@nestjs/common';
import { Request, Response } from 'express';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChatService } from 'src/chat/chat.service';
import { salasChat, suscriptor } from 'src/chat/interfaces/chat/chat.interface';

@Controller('api/room')
export class RoomsController {
    constructor (
        private readonly chatGateway: ChatGateway,
        private readonly chatService: ChatService
    ) {}

    @Get(':id/subscribers')
    async handleGetSalas(@Param('id') salaId: string, @Res() res: Response) {
        const subscribers = await this.chatService.getRoomSubscribers(salaId);
        return res.status(HttpStatus.OK).json(subscribers);
    }

    @Put(':id')
    async handlePutRoom(
        @Param('id') idSala: string,
        @Body() data: (salasChat & { suscriptores: suscriptor[] }),
        @Res() res: Response
    ) {
        const result = await this.chatService.updateSubscribers(idSala, data);

        const sala = data;
        delete sala.suscriptores;
        const _sala: salasChat = sala;

        const updatedRoom = await this.chatService.updateRoom(idSala, _sala);

        // Extraer el listado de id_user
        const suscriptoresAgregados = result.suscriptoresAgregados.map(s => s.id_user);

        console.log('NUEVOS SUSCRIPTORES ', suscriptoresAgregados);

        // Buscar si los usuarios están conectados al chat
        const connectedClientes = await this.chatService.searchClientsConnected(suscriptoresAgregados);

        // Notificar solo a los usuarios que tienen cliente conectado
        connectedClientes.forEach(client => {
            const subscriber = result.suscriptoresAgregados.find(s => s.id_user === client.userId);

            // Notificar suscipción al chat
            this.chatGateway.subscribeClientsToRoom(subscriber, connectedClientes, updatedRoom.tipo)
        });

        return res.status(HttpStatus.OK).json('Chat y suscriptores actualizados con éxito.');
    }
}