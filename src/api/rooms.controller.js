"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsController = void 0;
const common_1 = require("@nestjs/common");
const chat_gateway_1 = require("../chat/chat.gateway");
const chat_service_1 = require("../chat/chat.service");
const realtime_1 = require("../modules/realtime");
let RoomsController = class RoomsController {
    constructor(chatGateway, chatService, issuerJwtService) {
        this.chatGateway = chatGateway;
        this.chatService = chatService;
        this.issuerJwtService = issuerJwtService;
    }
    async handleGetSalas(salaId, req, res) {
        const { sala, isMember } = await this.chatService.getRoomAccess(salaId, req.identity);
        if (!sala)
            return res.status(common_1.HttpStatus.NOT_FOUND).json({ message: 'El chat no existe.' });
        if (!isMember)
            return res.status(common_1.HttpStatus.FORBIDDEN).json({ message: 'No perteneces a este chat.' });
        const subscribers = await this.chatService.getRoomSubscribers(salaId);
        return res.status(common_1.HttpStatus.OK).json(subscribers);
    }
    async handlePutRoom(idSala, data, req, res) {
        const identity = req.identity;
        const { sala, canManage } = await this.chatService.getRoomAccess(idSala, identity);
        if (!sala)
            return res.status(common_1.HttpStatus.NOT_FOUND).json({ message: 'El chat no existe.' });
        if (!canManage)
            return res.status(common_1.HttpStatus.FORBIDDEN).json({ message: 'No tienes permisos para editar este grupo.' });
        if (sala.tipo !== 2)
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'Solo se pueden editar grupos.' });
        const nombre_sala = typeof data?.nombre_sala === 'string' ? data.nombre_sala.trim() : '';
        const suscriptores = this.chatService.sanitizeSubscribers(data?.suscriptores);
        if (!nombre_sala) {
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'El nombre del grupo es obligatorio.' });
        }
        if (!suscriptores.some(s => s.id_user === identity.userId)) {
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({ message: 'Quien edita el grupo debe seguir siendo miembro.' });
        }
        const [roomWithName] = await this.chatService.validarSala([nombre_sala]);
        if (roomWithName && roomWithName.id_sala !== idSala) {
            return res.status(common_1.HttpStatus.CONFLICT).json({ message: 'Ya existe un chat con ese nombre.' });
        }
        const result = await this.chatService.updateSubscribers(idSala, { ...sala, nombre_sala, suscriptores });
        const updatedRoom = await this.chatService.updateRoom(idSala, { ...sala, nombre_sala });
        const qualify = (id_user) => this.issuerJwtService.qualifyUserId(identity.issuer, id_user);
        const activeSubscribers = await this.chatService.getActiveSubscribers(idSala);
        if (activeSubscribers.length > 0) {
            await this.chatGateway.verifyConnectedClients(updatedRoom.tipo, activeSubscribers);
        }
        if (result.suscriptoresEliminados.length > 0) {
            const connectedClientes = await this.chatService.searchClientsConnected(result.suscriptoresEliminados.map(s => qualify(s.id_user)));
            if (connectedClientes.length > 0) {
                this.chatGateway.unsubscribeClientsFromRoom(result.suscriptoresEliminados[0], connectedClientes, updatedRoom.tipo);
            }
        }
        return res.status(common_1.HttpStatus.OK).json('Chat y suscriptores actualizados con éxito.');
    }
    async handleDeleteRoom(idSala, req, res) {
        const identity = req.identity;
        const { sala, canManage } = await this.chatService.getRoomAccess(idSala, identity);
        if (!sala)
            return res.status(common_1.HttpStatus.NOT_FOUND).json({ message: 'El chat no existe.' });
        if (!canManage)
            return res.status(common_1.HttpStatus.FORBIDDEN).json({ message: 'No tienes permisos para eliminar este chat.' });
        try {
            const result = await this.chatService.deleteRoom(idSala);
            if (result.suscriptores && result.suscriptores.length > 0) {
                result.suscriptores.forEach(subscriber => {
                    this.chatGateway.emitToUser(this.issuerJwtService.qualifyUserId(identity.issuer, subscriber.id_user), 'salaEliminada', { id_sala: idSala });
                });
            }
            return res.status(common_1.HttpStatus.OK).json({
                message: 'Chat eliminado con éxito.'
            });
        }
        catch (error) {
            return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'Error al eliminar este Chat.',
                error: error?.message || error,
            });
        }
    }
};
exports.RoomsController = RoomsController;
__decorate([
    (0, common_1.Get)(':id/subscribers'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "handleGetSalas", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "handlePutRoom", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "handleDeleteRoom", null);
exports.RoomsController = RoomsController = __decorate([
    (0, common_1.Controller)('api/room'),
    (0, common_1.UseGuards)(realtime_1.UserJwtGuard),
    __metadata("design:paramtypes", [chat_gateway_1.ChatGateway,
        chat_service_1.ChatService,
        realtime_1.IssuerJwtService])
], RoomsController);
//# sourceMappingURL=rooms.controller.js.map