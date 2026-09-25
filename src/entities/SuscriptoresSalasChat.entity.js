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
exports.SuscriptoresSalasChat = void 0;
const typeorm_1 = require("typeorm");
const SalasChat_entity_1 = require("./SalasChat.entity");
let SuscriptoresSalasChat = class SuscriptoresSalasChat {
};
exports.SuscriptoresSalasChat = SuscriptoresSalasChat;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], SuscriptoresSalasChat.prototype, "id_user", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36, nullable: false }),
    __metadata("design:type", String)
], SuscriptoresSalasChat.prototype, "id_sala", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100 }),
    __metadata("design:type", String)
], SuscriptoresSalasChat.prototype, "nombre_sala", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 30 }),
    __metadata("design:type", String)
], SuscriptoresSalasChat.prototype, "imagen_sala", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], SuscriptoresSalasChat.prototype, "mensajes_por_leer", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'fecha_suscripcion' }),
    __metadata("design:type", Date)
], SuscriptoresSalasChat.prototype, "fecha_suscripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, default: () => 'NULL', name: 'fecha_eliminacion' }),
    __metadata("design:type", Date)
], SuscriptoresSalasChat.prototype, "fecha_eliminacion", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => SalasChat_entity_1.SalasChat, { onDelete: 'CASCADE', onUpdate: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'id_sala', referencedColumnName: "id_sala" }),
    __metadata("design:type", SalasChat_entity_1.SalasChat)
], SuscriptoresSalasChat.prototype, "salas", void 0);
exports.SuscriptoresSalasChat = SuscriptoresSalasChat = __decorate([
    (0, typeorm_1.Entity)({ name: 'suscriptores_salas_chat' })
], SuscriptoresSalasChat);
//# sourceMappingURL=SuscriptoresSalasChat.entity.js.map