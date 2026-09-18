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
exports.ApiController = void 0;
const common_1 = require("@nestjs/common");
const chat_gateway_1 = require("../chat/chat.gateway");
const realtime_1 = require("../modules/realtime");
let ApiController = class ApiController {
    constructor(chatGateway, socketServerProvider) {
        this.chatGateway = chatGateway;
        this.socketServerProvider = socketServerProvider;
    }
    async sendNotification(data, res) {
        const userNames = data.context.map(item => item.user_name);
        const issuer = data.issuer ?? 'repotencia';
        console.log('data', data);
        if (userNames.length !== 0) {
            data.context.forEach(item => {
                this.socketServerProvider.getNamespace('notifications')
                    .to(`userName:${issuer}:${item.user_name}`)
                    .emit('sentNotification', {
                    notification: data.notification,
                    type: data.type,
                    data: item
                });
            });
        }
        return res.status(common_1.HttpStatus.ACCEPTED).json({ status: true, message: 'Las notificaciones han sido aceptadas para enviarse' });
    }
    async sendNotificationAllUsers(data, res) {
        this.socketServerProvider.getNamespace('notifications').emit('sentNotification', {
            notification: data.notification,
            type: data.type,
            data: data.context ?? null
        });
        return res.status(common_1.HttpStatus.ACCEPTED).json({ status: true, message: 'Las notificaciones han sido aceptadas para enviarse' });
    }
    sendRequestStatusNotification(request) {
        const data = request.body;
        console.log('DATA RECIBIDA PARA sendRequestStatusNotification ', data);
        const io = request['app']['io'];
        if (!io) {
            console.error('Socket.io no está inicializado');
            return { error: 'WebSocket no disponible' };
        }
        const usuarioId = '31-r3Fyu8IhHqKL8AAAB';
        io.to(usuarioId).emit('requestStatus', data);
        return { status: 'Notificación enviada' };
    }
};
exports.ApiController = ApiController;
__decorate([
    (0, common_1.Post)('send-notification'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "sendNotification", null);
__decorate([
    (0, common_1.Post)('send-notification/all-users'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ApiController.prototype, "sendNotificationAllUsers", null);
__decorate([
    (0, common_1.Post)('request-status'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ApiController.prototype, "sendRequestStatusNotification", null);
exports.ApiController = ApiController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [chat_gateway_1.ChatGateway,
        realtime_1.SocketServerProvider])
], ApiController);
//# sourceMappingURL=api.controller.js.map