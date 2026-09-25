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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessagesHandler = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("../chat.service");
const realtime_1 = require("../../modules/realtime");
let ChatMessagesHandler = class ChatMessagesHandler {
    constructor(chatService, issuerJwtService) {
        this.chatService = chatService;
        this.issuerJwtService = issuerJwtService;
    }
    async handleSendMessage(server, data, identity) {
        const message = await this.chatService.createMensaje(data);
        await this.chatService.updateMessagesToRead(data.id_sala, data.id_user);
        const issuer = identity?.issuer;
        if (!issuer) {
            console.warn('MENSAJE SIN IDENTIDAD: no fue posible notificar en tiempo real', { id_sala: data.id_sala });
            return message;
        }
        const senderRoom = `user:${this.issuerJwtService.qualifyUserId(issuer, data.id_user)}`;
        server.to(senderRoom).emit('sentMessage', message);
        const roomSubscribers = await this.chatService.getRoomSubscribers(data.id_sala);
        const subscribersToNotify = roomSubscribers
            .filter(sub => sub.id_user !== data.id_user)
            .map(sub => sub.id_user);
        subscribersToNotify.forEach(userId => {
            const subscriberRoom = `user:${this.issuerJwtService.qualifyUserId(issuer, userId)}`;
            server.to(subscriberRoom).emit('newMessage', message);
        });
        return message;
    }
    async handleSetMessagesAsRead(server, data, identity) {
        await this.chatService.updateMessagesAsRead(data.id_sala, data.id_user);
        const issuer = identity?.issuer;
        if (!issuer)
            return;
        const userRoom = `user:${this.issuerJwtService.qualifyUserId(issuer, data.id_user)}`;
        server.to(userRoom).emit('messagesRead', data);
    }
    async handleJoinMessages(client, id_sala) {
        const messages = await this.chatService.obtenerMensajesSala(id_sala);
        client.emit('mensajesSala', messages);
    }
};
exports.ChatMessagesHandler = ChatMessagesHandler;
exports.ChatMessagesHandler = ChatMessagesHandler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        realtime_1.IssuerJwtService])
], ChatMessagesHandler);
//# sourceMappingURL=chat.messages.handler.js.map