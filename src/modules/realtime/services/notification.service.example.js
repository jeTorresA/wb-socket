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
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const event_dispatcher_service_1 = require("../services/event-dispatcher.service");
let NotificationService = class NotificationService {
    constructor(eventDispatcher) {
        this.eventDispatcher = eventDispatcher;
    }
    notifyMessageCreated(roomId, message) {
        const event = {
            namespace: 'chat',
            event: 'message.created',
            rooms: [roomId],
            payload: message,
        };
        this.eventDispatcher.publish(event);
    }
    notifyUsers(userIds, notification) {
        const event = {
            namespace: 'notifications',
            event: 'notification.new',
            users: userIds,
            payload: notification,
        };
        this.eventDispatcher.publish(event);
    }
    broadcastEvent(rooms, users, eventData) {
        const event = {
            namespace: 'chat',
            event: 'message.broadcast',
            rooms,
            users,
            payload: eventData,
        };
        this.eventDispatcher.publish(event);
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_dispatcher_service_1.EventDispatcherService])
], NotificationService);
//# sourceMappingURL=notification.service.example.js.map