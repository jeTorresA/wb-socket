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
let RoomsController = class RoomsController {
    constructor(chatGateway, chatService) {
        this.chatGateway = chatGateway;
        this.chatService = chatService;
    }
    async handleGetSalas(salaId, res) {
        const subscribers = await this.chatService.getRoomSubscribers(salaId);
        return res.status(common_1.HttpStatus.OK).json(subscribers);
    }
    async handlePutRoom(idSala, data, res) {
        const result = await this.chatService.updateSubscribers(idSala, data);
        const sala = data;
        delete sala.suscriptores;
        const _sala = sala;
        const updatedRoom = await this.chatService.updateRoom(idSala, _sala);
        const suscriptoresAgregados = result.suscriptoresAgregados.map(s => s.id_user);
        if (suscriptoresAgregados.length > 0) {
            const connectedClientes = await this.chatService.searchClientsConnected(suscriptoresAgregados);
            connectedClientes.forEach(client => {
                const subscriber = result.suscriptoresAgregados.find(s => s.id_user === client.userId);
                this.chatGateway.subscribeClientsToRoom(subscriber, connectedClientes, updatedRoom.tipo);
            });
        }
        if (result.suscriptoresEliminados.length > 0) {
            const suscriptoresEliminados = result.suscriptoresEliminados.map(s => s.id_user);
            const connectedClientes = await this.chatService.searchClientsConnected(suscriptoresEliminados);
            connectedClientes.forEach(client => {
                const subscriber = result.suscriptoresEliminados.find(s => s.id_user === client.userId);
                this.chatGateway.unsubscribeClientsFromRoom(subscriber, connectedClientes, updatedRoom.tipo);
            });
        }
        return res.status(common_1.HttpStatus.OK).json('Chat y suscriptores actualizados con éxito.');
    }
    async handleDeleteRoom(idSala, res) {
        try {
            const result = await this.chatService.deleteRoom(idSala);
            if (result.suscriptores && result.suscriptores.length > 0) {
                result.suscriptores.forEach(subscriber => {
                    this.chatGateway.emitToUser(subscriber.id_user, 'salaEliminada', { id_sala: idSala });
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
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "handleGetSalas", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "handlePutRoom", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RoomsController.prototype, "handleDeleteRoom", null);
exports.RoomsController = RoomsController = __decorate([
    (0, common_1.Controller)('api/room'),
    __metadata("design:paramtypes", [chat_gateway_1.ChatGateway,
        chat_service_1.ChatService])
], RoomsController);
//# sourceMappingURL=rooms.controller.js.map