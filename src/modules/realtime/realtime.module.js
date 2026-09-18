"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const event_dispatcher_service_1 = require("./services/event-dispatcher.service");
const socket_registry_service_1 = require("./services/socket-registry.service");
const socket_server_provider_1 = require("./providers/socket-server.provider");
const issuer_jwt_service_1 = require("./services/issuer-jwt.service");
const events_controller_1 = require("./controllers/events.controller");
const UserConected_entity_1 = require("../../entities/UserConected.entity");
let RealtimeModule = class RealtimeModule {
};
exports.RealtimeModule = RealtimeModule;
exports.RealtimeModule = RealtimeModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([UserConected_entity_1.UserConected])],
        controllers: [events_controller_1.EventsController],
        providers: [
            socket_server_provider_1.SocketServerProvider,
            event_dispatcher_service_1.EventDispatcherService,
            socket_registry_service_1.SocketRegistryService,
            issuer_jwt_service_1.IssuerJwtService,
        ],
        exports: [
            socket_server_provider_1.SocketServerProvider,
            event_dispatcher_service_1.EventDispatcherService,
            socket_registry_service_1.SocketRegistryService,
            issuer_jwt_service_1.IssuerJwtService,
        ],
    })
], RealtimeModule);
//# sourceMappingURL=realtime.module.js.map