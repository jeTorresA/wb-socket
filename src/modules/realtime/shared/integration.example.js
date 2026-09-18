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
exports.IntegrationExampleGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const socket_registry_service_1 = require("../services/socket-registry.service");
const event_dispatcher_service_1 = require("../services/event-dispatcher.service");
const base_gateway_1 = require("./base.gateway");
let IntegrationExampleGateway = class IntegrationExampleGateway extends base_gateway_1.BaseGateway {
    constructor(socketRegistry, eventDispatcher) {
        super();
        this.socketRegistry = socketRegistry;
        this.eventDispatcher = eventDispatcher;
    }
    async handleConnection(client) {
        const userId = client.handshake.query.userId;
        const userName = client.handshake.query.userName;
        await this.socketRegistry.registerSocket(client, userId, userName, 'example', {
            handshake: client.handshake,
            connected: true,
            connectedAt: new Date(),
        });
        this.eventDispatcher.publish({
            namespace: 'example',
            event: 'user.connected',
            users: ['user-1', 'user-2'],
            payload: { userId, userName },
        });
    }
    async handleDisconnect(client) {
        await this.socketRegistry.removeSocket(client.id);
        this.eventDispatcher.publish({
            namespace: 'example',
            event: 'user.disconnected',
            rooms: ['lobby'],
            payload: { socketId: client.id },
        });
    }
    async sendToUser(userId, message) {
        this.eventDispatcher.publish({
            namespace: 'example',
            event: 'message.received',
            users: [userId],
            payload: message,
        });
    }
    async broadcastToUsers(userIds, event, payload) {
        this.eventDispatcher.publish({
            namespace: 'example',
            event,
            users: userIds,
            payload,
        });
    }
};
exports.IntegrationExampleGateway = IntegrationExampleGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], IntegrationExampleGateway.prototype, "server", void 0);
exports.IntegrationExampleGateway = IntegrationExampleGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/example' }),
    __metadata("design:paramtypes", [socket_registry_service_1.SocketRegistryService,
        event_dispatcher_service_1.EventDispatcherService])
], IntegrationExampleGateway);
//# sourceMappingURL=integration.example.js.map