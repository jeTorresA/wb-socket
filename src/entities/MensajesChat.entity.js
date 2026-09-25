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
exports.MensajesChat = void 0;
const typeorm_1 = require("typeorm");
const SalasChat_entity_1 = require("./SalasChat.entity");
let MensajesChat = class MensajesChat {
};
exports.MensajesChat = MensajesChat;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MensajesChat.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, nullable: false }),
    __metadata("design:type", String)
], MensajesChat.prototype, "id_sala", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 450, nullable: false }),
    __metadata("design:type", String)
], MensajesChat.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "json", nullable: true, comment: 'contiene la lista de archivos del mensaje si los hay' }),
    __metadata("design:type", Object)
], MensajesChat.prototype, "archivos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: false }),
    __metadata("design:type", String)
], MensajesChat.prototype, "id_user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100 }),
    __metadata("design:type", String)
], MensajesChat.prototype, "userName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'fecha_creacion' }),
    __metadata("design:type", Date)
], MensajesChat.prototype, "fecha_creacion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => SalasChat_entity_1.SalasChat, { onDelete: 'CASCADE', onUpdate: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'id_sala', referencedColumnName: 'id_sala' }),
    __metadata("design:type", SalasChat_entity_1.SalasChat)
], MensajesChat.prototype, "salas", void 0);
exports.MensajesChat = MensajesChat = __decorate([
    (0, typeorm_1.Entity)({ name: 'mensajes_chat' })
], MensajesChat);
//# sourceMappingURL=MensajesChat.entity.js.map