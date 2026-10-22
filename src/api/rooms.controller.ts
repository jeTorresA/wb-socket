import { Controller, Res, HttpStatus, Body, Req, Get, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { ChatGateway } from 'src/chat/chat.gateway';
import { ChatService } from 'src/chat/chat.service';
import { IssuerJwtService, TokenIdentity, UserJwtGuard } from 'src/modules/realtime';
import { salasChat, suscriptor } from 'src/chat/interfaces/chat/chat.interface';

/**
 * Endpoints de administración de salas de chat.
 * Requieren el JWT del usuario (Authorization: Bearer TOKEN); la identidad se toma del token.
 */
@Controller('api/room')
@UseGuards(UserJwtGuard)
export class RoomsController {
    constructor (
        private readonly chatGateway: ChatGateway,
        private readonly chatService: ChatService,
        private readonly issuerJwtService: IssuerJwtService,
    ) {}

    /** Lista los suscriptores de una sala. Solo para miembros activos de la sala. */
    @Get(':id/subscribers')
    async handleGetSalas(@Param('id') salaId: string, @Req() req: Request & { identity: TokenIdentity }, @Res() res: Response) {
        const { sala, isMember } = await this.chatService.getRoomAccess(salaId, req.identity);
        if (!sala) return res.status(HttpStatus.NOT_FOUND).json({ message: 'El chat no existe.' });
        if (!isMember) return res.status(HttpStatus.FORBIDDEN).json({ message: 'No perteneces a este chat.' });

        const subscribers = await this.chatService.getRoomSubscribers(salaId);
        return res.status(HttpStatus.OK).json(subscribers);
    }

    /**
     * Actualiza el nombre y los miembros de un grupo.
     * Solo grupos, y solo su creador o un administrador que pertenezca al grupo. Quien edita debe
     * seguir siendo miembro (no puede retirarse a sí mismo con esta operación).
     */
    @Put(':id')
    async handlePutRoom(
        @Param('id') idSala: string,
        @Body() data: (salasChat & { suscriptores: suscriptor[] }),
        @Req() req: Request & { identity: TokenIdentity },
        @Res() res: Response
    ) {
        const identity = req.identity;
        const { sala, canManage } = await this.chatService.getRoomAccess(idSala, identity);
        if (!sala) return res.status(HttpStatus.NOT_FOUND).json({ message: 'El chat no existe.' });
        // Primero los permisos: a quien no participa no se le revela el tipo de la sala
        if (!canManage) return res.status(HttpStatus.FORBIDDEN).json({ message: 'No tienes permisos para editar este grupo.' });
        if (sala.tipo !== 2) return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Solo se pueden editar grupos.' });

        const nombre_sala = typeof data?.nombre_sala === 'string' ? data.nombre_sala.trim() : '';
        const suscriptores = this.chatService.sanitizeSubscribers(data?.suscriptores);
        if (!nombre_sala) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'El nombre del grupo es obligatorio.' });
        }
        if (!suscriptores.some(s => s.id_user === identity.userId)) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Quien edita el grupo debe seguir siendo miembro.' });
        }

        // Validar antes de aplicar cambios: el nombre de la sala es único
        const [roomWithName] = await this.chatService.validarSala([nombre_sala]);
        if (roomWithName && roomWithName.id_sala !== idSala) {
            return res.status(HttpStatus.CONFLICT).json({ message: 'Ya existe un chat con ese nombre.' });
        }

        const result = await this.chatService.updateSubscribers(idSala, { ...sala, nombre_sala, suscriptores });
        const updatedRoom = await this.chatService.updateRoom(idSala, { ...sala, nombre_sala });

        // Los id_user del chat son crudos; se califican para emitir a las rooms globales
        const qualify = (id_user: string) => this.issuerJwtService.qualifyUserId(identity.issuer, id_user);

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

    /**
     * Elimina una sala. Un chat directo lo puede eliminar cualquiera de sus participantes;
     * un grupo, solo su creador o un administrador que pertenezca al grupo.
     */
    @Delete(':id')
    async handleDeleteRoom(
        @Param('id') idSala: string,
        @Req() req: Request & { identity: TokenIdentity },
        @Res() res: Response
    ) {
        const identity = req.identity;
        const { sala, canManage } = await this.chatService.getRoomAccess(idSala, identity);
        if (!sala) return res.status(HttpStatus.NOT_FOUND).json({ message: 'El chat no existe.' });
        if (!canManage) return res.status(HttpStatus.FORBIDDEN).json({ message: 'No tienes permisos para eliminar este chat.' });

        try {
            const result = await this.chatService.deleteRoom(idSala);

            // Notificar a TODOS los usuarios usando rooms globales (ids calificados por emisor)
            if(result.suscriptores && result.suscriptores.length > 0) {
                result.suscriptores.forEach(subscriber => {
                    this.chatGateway.emitToUser(
                        this.issuerJwtService.qualifyUserId(identity.issuer, subscriber.id_user),
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
