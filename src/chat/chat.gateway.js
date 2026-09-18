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
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const chat_service_1 = require("./chat.service");
const chat_messages_handler_1 = require("./handlers/chat.messages.handler");
const chat_rooms_handler_1 = require("./handlers/chat.rooms.handler");
const chat_files_handler_1 = require("./handlers/chat.files.handler");
const realtime_1 = require("../modules/realtime");
let ChatGateway = class ChatGateway {
    constructor(chatService, messagesHandler, roomsHandler, filesHandler, socketServerProvider, socketRegistryService, issuerJwtService) {
        this.chatService = chatService;
        this.messagesHandler = messagesHandler;
        this.roomsHandler = roomsHandler;
        this.filesHandler = filesHandler;
        this.socketServerProvider = socketServerProvider;
        this.socketRegistryService = socketRegistryService;
        this.issuerJwtService = issuerJwtService;
        this.server = new socket_io_1.Server();
    }
    afterInit(server) {
        const rootServer = server.server;
        this.socketServerProvider.setServer(rootServer);
        this.server.use(this.issuerJwtService.middleware());
    }
    handleConnection(client, user_id) {
        console.info('USUARIO CONECTADO ', { client_id: client.id, user_id });
    }
    async handleDisconnect(client) {
        try {
            await this.socketRegistryService.removeSocket(client.id);
        }
        catch (error) {
            console.error('NO FUE POSIBLE ELIMINAR EL CLIENTE DESCONECTADO DE LA LISTA ', error);
        }
    }
    async userConect(client) {
        const identity = client.data?.identity;
        if (!identity)
            return;
        const { userId, userName } = this.issuerJwtService.qualify(identity);
        await this.socketRegistryService.registerSocket(client, userId, userName, 'chat', {
            issuer: identity.issuer,
            handshake: client.handshake,
            rooms: Array.from(client.rooms),
            connected: client.connected,
        });
    }
    async handleJoinRoom(client, params) {
        await this.roomsHandler.handleJoinRoom(client, params);
    }
    async handleJoinMensajesSalas(client, id_sala) {
        setTimeout(async () => {
            await this.messagesHandler.handleJoinMessages(client, id_sala);
        }, 100);
    }
    async handleCreateSala(client, data) {
        await this.roomsHandler.handleCreateRoom(this.server, client, data);
    }
    async handleMessage(client, data) {
        await this.messagesHandler.handleSendMessage(this.server, data);
    }
    async handleSetMessagesAsRead(client, data) {
        await this.messagesHandler.handleSetMessagesAsRead(this.server, data);
    }
    async handleGetFile(data, client) {
        await this.filesHandler.handleGetFile(client, data);
    }
    uploadFile(file, fileName, fileMimeType) {
        return this.filesHandler.uploadFile(file, fileName, fileMimeType);
    }
    isClientActive(socketId) {
        return this.server.sockets.sockets.has(socketId);
    }
    emitToUser(userId, event, data) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
    async verifyConnectedClients(roomType, room) {
        await this.roomsHandler.subscribeClients(this.server, roomType, room);
    }
    async subscribeClientsToRoom(room, clients, roomType) {
        await this.roomsHandler['subscribeClientsToRoom'](this.server, room, clients, roomType);
    }
    async unsubscribeClientsFromRoom(room, clients, roomType) {
        this.roomsHandler.unsubscribeClientsFromRoom(this.server, room, clients, roomType);
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('userConected'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "userConect", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinMessages'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinMensajesSalas", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('createRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleCreateSala", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('setMessagesAsRead'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSetMessagesAsRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getFile'),
    __param(0, (0, websockets_1.MessageBody)('data')),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleGetFile", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/chat' }),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        chat_messages_handler_1.ChatMessagesHandler,
        chat_rooms_handler_1.ChatRoomsHandler,
        chat_files_handler_1.ChatFilesHandler,
        realtime_1.SocketServerProvider,
        realtime_1.SocketRegistryService,
        realtime_1.IssuerJwtService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map