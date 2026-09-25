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
exports.ChatRoomsHandler = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("../chat.service");
const realtime_1 = require("../../modules/realtime");
let ChatRoomsHandler = class ChatRoomsHandler {
    constructor(chatService, socketRegistryService, issuerJwtService) {
        this.chatService = chatService;
        this.socketRegistryService = socketRegistryService;
        this.issuerJwtService = issuerJwtService;
    }
    async handleJoinRoom(client, params) {
        const salasSuscritas = await this.chatService.obtenerSalasSuscritas(params.id_user, params.salasActuales);
        if (salasSuscritas.length > 0) {
            salasSuscritas.forEach(data => {
                client.join(data.salas.nombre_sala);
                data.mensajes = [];
            });
            client.emit('joinedRooms', salasSuscritas);
        }
    }
    async handleCreateRoom(server, client, data, identity) {
        const result = await this.chatService.createSala(data);
        if (result.type === 'warning') {
            client.emit('advertencia', result.message);
            return;
        }
        const subscribers = result.data.subscribers;
        const principalSubscriber = subscribers.filter(sub => sub.id_user === data.creador);
        const otherSubscribers = subscribers.filter(sub => sub.id_user !== data.creador);
        await this.subscribeClients(server, result.data.tipo_sala, principalSubscriber, identity);
        await this.subscribeClients(server, result.data.tipo_sala, otherSubscribers, identity);
    }
    async subscribeClients(server, roomType, subscribers, identity) {
        if (subscribers.length === 0)
            return;
        const issuer = identity?.issuer ?? 'repotencia';
        const userIds = subscribers.map(sub => sub.id_user);
        const qualifiedUserIds = userIds.map(userId => this.issuerJwtService.qualifyUserId(issuer, userId));
        const connectedClients = await this.socketRegistryService.getUsersSockets(qualifiedUserIds, 'chat');
        this.subscribeClientsToRoom(server, subscribers[0], connectedClients, roomType);
        subscribers.forEach(sub => {
            const userRoom = `user:${this.issuerJwtService.qualifyUserId(issuer, sub.id_user)}`;
            server.to(userRoom).emit('newSala', { ...sub, tipo: roomType });
        });
    }
    subscribeClientsToRoom(server, room, clients, roomType) {
        clients.forEach((client) => {
            const socket = server.sockets.get(client.client.id);
            if (socket) {
                socket.join(room.id_sala);
                socket.emit('salaSuscrita', { ...room, tipo: roomType });
            }
            else {
                this.socketRegistryService.removeSocket(client.client.id);
            }
        });
    }
    unsubscribeClientsFromRoom(server, room, clients, roomType) {
        clients.forEach((client) => {
            const socket = server.sockets.get(client.client.id);
            if (socket) {
                socket.leave(room.id_sala);
                socket.emit('salaEliminada', { ...room, tipo: roomType });
            }
            else {
                this.socketRegistryService.removeSocket(client.client.id);
            }
        });
    }
};
exports.ChatRoomsHandler = ChatRoomsHandler;
exports.ChatRoomsHandler = ChatRoomsHandler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        realtime_1.SocketRegistryService,
        realtime_1.IssuerJwtService])
], ChatRoomsHandler);
//# sourceMappingURL=chat.rooms.handler.js.map