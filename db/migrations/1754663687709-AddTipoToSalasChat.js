"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTipoToSalasChat1754663687709 = void 0;
const typeorm_1 = require("typeorm");
class AddTipoToSalasChat1754663687709 {
    async up(queryRunner) {
        await queryRunner.addColumn("salas_chat", new typeorm_1.TableColumn({
            name: "tipo",
            type: "int",
            isNullable: false,
            default: 1,
            comment: '1:chat simple-2:grupo'
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn("salas_chat", "tipo");
    }
}
exports.AddTipoToSalasChat1754663687709 = AddTipoToSalasChat1754663687709;
//# sourceMappingURL=1754663687709-AddTipoToSalasChat.js.map