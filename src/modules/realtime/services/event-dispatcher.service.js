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
exports.EventDispatcherService = void 0;
const common_1 = require("@nestjs/common");
const socket_server_provider_1 = require("../providers/socket-server.provider");
let EventDispatcherService = class EventDispatcherService {
    constructor(socketServerProvider) {
        this.socketServerProvider = socketServerProvider;
    }
    setServer(server) {
        this.socketServerProvider.setServer(server);
    }
    getNamespace(namespace) {
        return this.socketServerProvider.getNamespace(namespace);
    }
    emitToRooms(namespace, rooms, event, payload) {
        this.socketServerProvider.emitToRooms(namespace, rooms, event, payload);
    }
    emitToUsers(namespace, users, event, payload) {
        this.socketServerProvider.emitToUsers(namespace, users, event, payload);
    }
    publish(dto) {
        if (dto.rooms && dto.rooms.length > 0) {
            this.emitToRooms(dto.namespace, dto.rooms, dto.event, dto.payload);
        }
        if (dto.users && dto.users.length > 0) {
            this.emitToUsers(dto.namespace, dto.users, dto.event, dto.payload);
        }
    }
};
exports.EventDispatcherService = EventDispatcherService;
exports.EventDispatcherService = EventDispatcherService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [socket_server_provider_1.SocketServerProvider])
], EventDispatcherService);
//# sourceMappingURL=event-dispatcher.service.js.map