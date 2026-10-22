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
        if (!identity) {
            console.warn('MENSAJE RECHAZADO (socket sin identidad)', { id_sala: data?.id_sala });
            return;
        }
        const senderId = identity.userId;
        const roomSubscribers = await this.chatService.getRoomSubscribers(data.id_sala);
        if (!roomSubscribers.some(sub => sub.id_user === senderId)) {
            console.warn('MENSAJE RECHAZADO (el emisor no pertenece a la sala)', { id_sala: data.id_sala, id_user: senderId });
            return;
        }
        const message = await this.chatService.createMensaje({ ...data, id_user: senderId });
        await this.chatService.updateMessagesToRead(data.id_sala, senderId);
        const issuer = identity.issuer;
        const senderRoom = `user:${this.issuerJwtService.qualifyUserId(issuer, senderId)}`;
        server.to(senderRoom).emit('sentMessage', message);
        const subscribersToNotify = roomSubscribers
            .filter(sub => sub.id_user !== senderId)
            .map(sub => sub.id_user);
        subscribersToNotify.forEach(userId => {
            const subscriberRoom = `user:${this.issuerJwtService.qualifyUserId(issuer, userId)}`;
            server.to(subscriberRoom).emit('newMessage', message);
        });
        return message;
    }
    async handleSetMessagesAsRead(server, data, identity) {
        if (!identity)
            return;
        const readerId = identity.userId;
        await this.chatService.updateMessagesAsRead(data.id_sala, readerId);
        const userRoom = `user:${this.issuerJwtService.qualifyUserId(identity.issuer, readerId)}`;
        server.to(userRoom).emit('messagesRead', { id_sala: data.id_sala, id_user: readerId });
    }
    async handleJoinMessages(client, id_sala) {
        const identity = client.data?.identity;
        if (!identity || !(await this.chatService.isActiveSubscriber(id_sala, identity.userId))) {
            console.warn('HISTORIAL RECHAZADO (el usuario no pertenece a la sala)', { id_sala, id_user: identity?.userId });
            client.emit('mensajesSala', []);
            return;
        }
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