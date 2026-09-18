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
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const realtime_1 = require("../modules/realtime");
let NotificationsGateway = class NotificationsGateway {
    constructor(socketServerProvider, socketRegistryService, issuerJwtService) {
        this.socketServerProvider = socketServerProvider;
        this.socketRegistryService = socketRegistryService;
        this.issuerJwtService = issuerJwtService;
        this.server = new socket_io_1.Server();
    }
    afterInit(server) {
        const rootServer = server.server;
        if (!this.socketServerProvider.isInitialized()) {
            this.socketServerProvider.setServer(rootServer);
        }
        this.server.use(this.issuerJwtService.middleware());
    }
    handleConnection(client) {
        console.info('USUARIO CONECTADO A NOTIFICATIONS', { client_id: client.id });
    }
    async handleDisconnect(client) {
        try {
            await this.socketRegistryService.removeSocket(client.id);
        }
        catch (error) {
            console.error('ERROR AL DESCONECTAR CLIENTE DE NOTIFICATIONS', error);
        }
    }
    async userConect(client) {
        const identity = client.data?.identity;
        if (!identity)
            return;
        const { userId, userName } = this.issuerJwtService.qualify(identity);
        const userNameRoom = `userName:${userName}`;
        if (!client.rooms.has(userNameRoom)) {
            client.join(userNameRoom);
        }
        await this.socketRegistryService.registerSocket(client, userId, userName, 'notifications', {
            issuer: identity.issuer,
            handshake: client.handshake,
            rooms: Array.from(client.rooms),
            connected: client.connected,
        });
    }
    async eventMarkedDone(client, eventId) {
        const identity = client.data?.identity;
        if (!identity)
            return;
        console.info('EVENTO MARCADO COMO CUMPLIDO', { identity, eventId });
        const { userId } = this.issuerJwtService.qualify(identity);
        this.emitToUser(userId, 'eventMarkedDone', { eventId });
    }
    emitToUser(userId, event, data) {
        this.server.to(`user:${userId}`).emit(event, data);
    }
    emitToUserName(userName, event, data) {
        this.server.to(`userName:${userName}`).emit(event, data);
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('userConected'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], NotificationsGateway.prototype, "userConect", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('eventMarkedDone'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)('eventId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], NotificationsGateway.prototype, "eventMarkedDone", null);
exports.NotificationsGateway = NotificationsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/notifications' }),
    __metadata("design:paramtypes", [realtime_1.SocketServerProvider,
        realtime_1.SocketRegistryService,
        realtime_1.IssuerJwtService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map