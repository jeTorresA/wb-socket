"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseGateway = void 0;
class BaseGateway {
    registerUserRoom(client, userId) {
        const userRoom = `user:${userId}`;
        if (!client.rooms.has(userRoom)) {
            client.join(userRoom);
        }
    }
    emitToUsers(namespace, users, event, payload) {
        const ns = this.server.of(`/${namespace}`);
        users.forEach(userId => {
            ns.to(`user:${userId}`).emit(event, payload);
        });
    }
    emitToRooms(namespace, rooms, event, payload) {
        const ns = this.server.of(`/${namespace}`);
        rooms.forEach(room => {
            ns.to(room).emit(event, payload);
        });
    }
    isSocketActive(socketId) {
        return this.server.sockets.sockets.has(socketId);
    }
    isSocketActiveInNamespace(namespace, socketId) {
        const ns = this.server.of(`/${namespace}`);
        return ns.sockets.has(socketId);
    }
}
exports.BaseGateway = BaseGateway;
//# sourceMappingURL=base.gateway.js.map