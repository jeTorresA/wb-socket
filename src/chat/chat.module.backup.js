"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const chat_gateway_1 = require("./chat.gateway");
const typeorm_1 = require("@nestjs/typeorm");
const MensajesChat_entity_1 = require("../entities/MensajesChat.entity");
const SuscriptoresSalasChat_entity_1 = require("../entities/SuscriptoresSalasChat.entity");
const SalasChat_entity_1 = require("../entities/SalasChat.entity");
const ArchivosChat_entity_1 = require("../entities/ArchivosChat.entity");
const UserConected_entity_1 = require("../entities/UserConected.entity");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        providers: [chat_service_1.ChatService, chat_gateway_1.ChatGateway],
        imports: [typeorm_1.TypeOrmModule.forFeature([MensajesChat_entity_1.MensajesChat, SuscriptoresSalasChat_entity_1.SuscriptoresSalasChat, SalasChat_entity_1.SalasChat, ArchivosChat_entity_1.ArchivosChat, UserConected_entity_1.UserConected])],
        exports: [chat_gateway_1.ChatGateway, chat_service_1.ChatService]
    })
], ChatModule);
//# sourceMappingURL=chat.module.backup.js.map