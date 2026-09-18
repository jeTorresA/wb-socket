"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketServerProvider = void 0;
const common_1 = require("@nestjs/common");
let SocketServerProvider = class SocketServerProvider {
    onModuleInit() {
    }
    setServer(server) {
        this.server = server;
    }
    getServer() {
        if (!this.server) {
            throw new Error('Socket.IO server no ha sido inicializado');
        }
        return this.server;
    }
    isInitialized() {
        return !!this.server;
    }
    getNamespace(namespace) {
        return this.getServer().of(`/${namespace}`);
    }
    emitToNamespace(namespace, event, data) {
        this.getNamespace(namespace).emit(event, data);
    }
    emitToRooms(namespace, rooms, event, data) {
        const ns = this.getNamespace(namespace);
        rooms.forEach(room => {
            ns.to(room).emit(event, data);
        });
    }
    emitToUsers(namespace, users, event, data) {
        const ns = this.getNamespace(namespace);
        users.forEach(userId => {
            ns.to(`user:${userId}`).emit(event, data);
        });
    }
};
exports.SocketServerProvider = SocketServerProvider;
exports.SocketServerProvider = SocketServerProvider = __decorate([
    (0, common_1.Injectable)()
], SocketServerProvider);
//# sourceMappingURL=socket-server.provider.js.map