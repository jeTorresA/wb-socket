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
exports.ArchivosChat = void 0;
const typeorm_1 = require("typeorm");
const MensajesChat_entity_1 = require("./MensajesChat.entity");
let ArchivosChat = class ArchivosChat {
};
exports.ArchivosChat = ArchivosChat;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ArchivosChat.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 11, nullable: false }),
    __metadata("design:type", String)
], ArchivosChat.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: false }),
    __metadata("design:type", String)
], ArchivosChat.prototype, "id_mensaje", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], ArchivosChat.prototype, "id_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], ArchivosChat.prototype, "ubicacion", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => MensajesChat_entity_1.MensajesChat, mensaje => mensaje.id, { onDelete: 'CASCADE', onUpdate: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'id_mensaje' }),
    __metadata("design:type", MensajesChat_entity_1.MensajesChat)
], ArchivosChat.prototype, "mensaje", void 0);
exports.ArchivosChat = ArchivosChat = __decorate([
    (0, typeorm_1.Entity)({ name: 'archivos_chat' })
], ArchivosChat);
//# sourceMappingURL=ArchivosChat.entity.js.map