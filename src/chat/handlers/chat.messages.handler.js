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
let ChatMessagesHandler = class ChatMessagesHandler {
    constructor(chatService) {
        this.chatService = chatService;
    }
    async handleSendMessage(server, data) {
        const message = await this.chatService.createMensaje(data);
        await this.chatService.updateMessagesToRead(data.id_sala, data.id_user);
        server.to(`user:${data.id_user}`).emit('sentMessage', message);
        const roomSubscribers = await this.chatService.getRoomSubscribers(data.id_sala);
        const subscribersToNotify = roomSubscribers
            .filter(sub => sub.id_user !== data.id_user)
            .map(sub => sub.id_user);
        if (subscribersToNotify.length > 0) {
            subscribersToNotify.forEach(userId => {
                server.to(`user:${userId}`).emit('newMessage', message);
            });
        }
        return message;
    }
    async handleSetMessagesAsRead(server, data) {
        await this.chatService.updateMessagesAsRead(data.id_sala, data.id_user);
        server.to(`user:${data.id_user}`).emit('messagesRead', data);
    }
    async handleJoinMessages(client, id_sala) {
        const messages = await this.chatService.obtenerMensajesSala(id_sala);
        client.emit('mensajesSala', messages);
    }
};
exports.ChatMessagesHandler = ChatMessagesHandler;
exports.ChatMessagesHandler = ChatMessagesHandler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatMessagesHandler);
//# sourceMappingURL=chat.messages.handler.js.map