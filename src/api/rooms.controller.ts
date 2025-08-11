import { Controller, Post, Res, HttpStatus, Body, Req, Get, Query, Put, Param, Delete } from '@nestjs/common';
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

        // Si hay suscriptores agregados, enviar notificación
        if(suscriptoresAgregados.length > 0) {
            // Buscar si los usuarios están conectados al chat
            const connectedClientes = await this.chatService.searchClientsConnected(suscriptoresAgregados);

            // Notificar solo a los usuarios que tienen cliente conectado
            connectedClientes.forEach(client => {
                const subscriber = result.suscriptoresAgregados.find(s => s.id_user === client.userId);
    
                // Notificar suscipción al chat
                this.chatGateway.subscribeClientsToRoom(subscriber, connectedClientes, updatedRoom.tipo)
            });
        }

        // Si hay suscriptores eliminados, notificar a los usuarios conectados
        // Solo si hay suscriptores eliminados
        if(result.suscriptoresEliminados.length > 0) {
            //  Extraer el listado de id_user de los suscriptores eliminados
            const suscriptoresEliminados = result.suscriptoresEliminados.map(s => s.id_user);

            // Buscar si los usuarios están conectados al chat
            const connectedClientes = await this.chatService.searchClientsConnected(suscriptoresEliminados);

            // Notificar solo a los usuarios que tienen cliente conectado
            connectedClientes.forEach(client => {
                const subscriber = result.suscriptoresEliminados.find(s => s.id_user === client.userId);
    
                // Notificar eliminación de suscripción al chat
                this.chatGateway.unsubscribeClientsFromRoom(subscriber, connectedClientes, updatedRoom.tipo)
            });
        }

        return res.status(HttpStatus.OK).json('Chat y suscriptores actualizados con éxito.');
    }

    @Delete(':id')
    async handleDeleteRoom(
        @Param('id') idSala: string,
        @Res() res: Response
    ) {
        try {
            const result = await this.chatService.deleteRoom(idSala);

            // Notificar a los clientes conectados que la sala ha sido eliminada
            if(result.suscriptores && result.suscriptores.length > 0) {
                const connectedClientes = await this.chatService.searchClientsConnected(result.suscriptores.map(s => s.id_user));

                connectedClientes.forEach(client => {
                    this.chatGateway.emitEventToClient(
                        client,
                        'salaEliminada',
                        { id_sala: idSala }
                    );
                });
            }

            return res.status(HttpStatus.OK).json({
                message: 'Chat eliminado con éxito.'
            });
        } catch (error) {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Error al eliminar este Chat.',
                error: error?.message || error,
            });
        }
    }
}