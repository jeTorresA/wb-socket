import { Controller, Post, Res, HttpStatus, Body, Req, Get, Query, Put, Param, Delete } from '@nestjs/common';
import { Request, Response } from 'express';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChatService } from 'src/chat/chat.service';
import { IssuerJwtService } from 'src/modules/realtime';
import { salasChat, suscriptor } from 'src/chat/interfaces/chat/chat.interface';

@Controller('api/room')
export class RoomsController {
    constructor (
        private readonly chatGateway: ChatGateway,
        private readonly chatService: ChatService,
        private readonly issuerJwtService: IssuerJwtService,
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
        // Validar antes de aplicar cambios: el nombre de la sala es único
        if (data.nombre_sala) {
            const [roomWithName] = await this.chatService.validarSala([data.nombre_sala]);
            if (roomWithName && roomWithName.id_sala !== idSala) {
                return res.status(HttpStatus.CONFLICT).json({ message: 'Ya existe un chat con ese nombre.' });
            }
        }

        const result = await this.chatService.updateSubscribers(idSala, data);

        const sala = data;
        delete sala.suscriptores;
        const _sala: salasChat = sala;

        const updatedRoom = await this.chatService.updateRoom(idSala, _sala);

        // Los id_user del chat son crudos; se califican para emitir a las rooms globales
        const issuer = 'repotencia';
        const qualify = (id_user: string) => this.issuerJwtService.qualifyUserId(issuer, id_user);

        // Notificar a TODOS los suscriptores activos (agregados y existentes): así los
        // nuevos miembros ven la sala y los actuales reciben el nombre actualizado
        const activeSubscribers = await this.chatService.getActiveSubscribers(idSala);
        if (activeSubscribers.length > 0) {
            await this.chatGateway.verifyConnectedClients(updatedRoom.tipo, activeSubscribers);
        }

        // Suscriptores eliminados: notificar una sola vez con todos sus clientes conectados
        if (result.suscriptoresEliminados.length > 0) {
            const connectedClientes = await this.chatService.searchClientsConnected(
                result.suscriptoresEliminados.map(s => qualify(s.id_user))
            );

            if (connectedClientes.length > 0) {
                this.chatGateway.unsubscribeClientsFromRoom(result.suscriptoresEliminados[0], connectedClientes, updatedRoom.tipo);
            }
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

            // Notificar a TODOS los usuarios usando rooms globales (ids calificados por emisor)
            if(result.suscriptores && result.suscriptores.length > 0) {
                result.suscriptores.forEach(subscriber => {
                    this.chatGateway.emitToUser(
                        this.issuerJwtService.qualifyUserId('repotencia', subscriber.id_user),
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