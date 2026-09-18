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
const path_1 = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const UtilitiesFunctions_1 = require("../utilities/UtilitiesFunctions");
let ChatGateway = class ChatGateway {
    constructor(chatService) {
        this.chatService = chatService;
        this.server = new socket_io_1.Server();
    }
    handleConnection(client, user_id) {
        console.info('USUARIO CONECTADO ', { cliend_id: client.id, user_id });
    }
    async handleDisconnect(client) {
        try {
            const removed = await this.chatService.removeClientConnected(client.id);
        }
        catch (error) {
            console.error('NO FUE POSIBLE ELIMINAR EL CLIENTE DESCONECTADO DE LA LISTA ', error);
        }
    }
    async userConect(userId, userName, client) {
        let clientData = {
            id: client.id,
            handshake: client.handshake,
            rooms: Array.from(client.rooms),
            connected: client.connected,
            join: client.join('')
        };
        const data = { userId: userId, userName: userName, client: clientData };
        await this.chatService.usersConected(data);
    }
    async handleJoinRoom(client, params) {
        let salasSuscritas = [];
        await this.chatService.obtenerSalasSuscritas(params.id_user, params.salasActuales).then(response => {
            salasSuscritas = response;
            if (response.length != 0) {
                salasSuscritas.map(async (data) => {
                    client.join((data.salas.nombre_sala));
                    data.mensajes = [];
                });
                client.emit('joinedRooms', salasSuscritas);
            }
        });
    }
    async handleJoinMensajesSalas(client, id_sala) {
        setTimeout(async () => {
            await this.chatService.obtenerMensajesSala(id_sala).then(respuesta => {
                this.server.emit('mensajesSala', respuesta);
            });
        }, 100);
    }
    async handleCreateSala(client, data) {
        await this.chatService.createSala(data).then(async (res) => {
            if (res.type === "warning") {
                client.emit('advertencia', res.message);
            }
            else {
                const principalSubscriber = res.data.subscribers.filter((subs) => (subs.id_user === data.creador));
                await this.verifyConnectedClients(res.data.tipo_sala, principalSubscriber);
                const otherSubscribers = res.data.subscribers.filter((subs) => (subs.id_user !== data.creador));
                await this.verifyConnectedClients(res.data.tipo_sala, otherSubscribers);
            }
        });
    }
    async verifyConnectedClients(roomType, room) {
        let userIds = [];
        let roomId = '';
        room.map((subscriber) => {
            userIds.push(subscriber.id_user);
            roomId = subscriber.id_sala;
        });
        const connectedClientes = await this.chatService.searchClientsConnected(userIds);
        this.subscribeClientsToRoom(room[0], connectedClientes, roomType);
    }
    async subscribeClientsToRoom(room, clients, roomType) {
        clients.map((client) => {
            if (this.isClientActive(client.client.id)) {
                const notifyClient = this.server.sockets.sockets.get(client.client.id);
                notifyClient.join(room.id_sala);
                notifyClient.emit('newSala', { ...room, tipo: roomType });
                notifyClient.emit('salaSuscrita', { ...room, tipo: roomType });
            }
            else {
                this.chatService.removeClientConnected(client.client.id);
            }
        });
    }
    async unsubscribeClientsFromRoom(room, clients, roomType) {
        clients.map((client) => {
            if (this.isClientActive(client.client.id)) {
                const notifyClient = this.server.sockets.sockets.get(client.client.id);
                notifyClient.leave(room.id_sala);
                notifyClient.emit('salaEliminada', { ...room, tipo: roomType });
            }
            else {
                this.chatService.removeClientConnected(client.client.id);
            }
        });
    }
    async handleMessage(client, data) {
        const message = await this.chatService.createMensaje(data);
        await this.chatService.updateMessagesToRead(data.id_sala, data.id_user);
        const userClients = await this.chatService.searchClientsConnected([data.id_user]);
        userClients.map((client) => {
            this.emitEventToClient(client, 'sentMessage', message);
        });
        const roomSubscribers = await this.chatService.getRoomSubscribers(data.id_sala);
        let subscribersToNotify = [];
        roomSubscribers.map((subscriber) => {
            if (subscriber.id_user !== data.id_user)
                subscribersToNotify.push(subscriber.id_user);
        });
        const notifyToClients = await this.chatService.searchClientsConnected(subscribersToNotify);
        notifyToClients.map((client) => {
            this.emitEventToClient(client, 'newMessage', message);
        });
    }
    async emitEventToClient(client, event, data) {
        try {
            const notifyClient = this.server.sockets.sockets.get(client.client.id);
            if (notifyClient) {
                notifyClient.emit(event, data);
            }
            else {
                this.chatService.removeClientConnected(client.client.id);
            }
        }
        catch (error) {
            console.error('Algo ha salido mal en este proceso', { clientId: client.client.id, error });
        }
    }
    async handleSetMessagesAsRead(client, data) {
        const updated = await this.chatService.updateMessagesAsRead(data.id_sala, data.id_user);
        const notifyToClients = await this.chatService.searchClientsConnected([data.id_user]);
        notifyToClients.map((client) => {
            this.emitEventToClient(client, 'messagesRead', data);
        });
    }
    async handleGetFile(data, client) {
        const folderPath = path_1.default.join(__dirname, '..', '..', 'public', data.location);
        const filePath = path_1.default.join(folderPath, data.fileName);
        try {
            const fileBuffer = await fsp.readFile(filePath);
            client.emit('getFileSuccess', { fileName: data.fileName, data: fileBuffer.toString('base64') });
        }
        catch (error) {
            console.error('Error al leer el archivo: ', error);
            client.emit('getFileError', { message: 'Error al obtener el archivo.' });
        }
    }
    uploadFile(file, fileName, fileMimeType) {
        let response = { status: false, fileName: null, fileLocation: null, mimeType: null };
        const buffer = Buffer.from(file);
        const uniqueFileName = UtilitiesFunctions_1.UtilitiesFunctions.generateHexString(12);
        const uploadDir = path_1.default.join(__dirname, '..', '..', 'public', 'uploads');
        const fileNameSaved = `${uniqueFileName}_${fileName}`;
        const uploadFile = path_1.default.join(uploadDir, fileNameSaved);
        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true, mode: 0o755 });
            }
            fs.writeFileSync(uploadFile, buffer);
            response = { status: true, fileName: fileNameSaved, fileLocation: 'uploads', mimeType: fileMimeType };
        }
        catch (error) {
            console.error('Sucedió un error al cargar el archivo ', error);
        }
        return response;
    }
    isClientActive(socketId) {
        return this.server.sockets.sockets.has(socketId);
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('userConected'),
    __param(0, (0, websockets_1.MessageBody)('userId')),
    __param(1, (0, websockets_1.MessageBody)('userName')),
    __param(2, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "userConect", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinMessages'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinMensajesSalas", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('createRoom'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleCreateSala", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('setMessagesAsRead'),
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
    (0, websockets_1.WebSocketGateway)(),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.backup.js.map