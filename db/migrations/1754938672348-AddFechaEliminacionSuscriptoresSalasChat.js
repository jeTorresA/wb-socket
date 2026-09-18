"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddFechaEliminacionSuscriptoresSalasChat1754938672348 = void 0;
const typeorm_1 = require("typeorm");
class AddFechaEliminacionSuscriptoresSalasChat1754938672348 {
    async up(queryRunner) {
        await queryRunner.addColumn("suscriptores_salas_chat", new typeorm_1.TableColumn({
            name: "fecha_eliminacion",
            type: "timestamp",
            isNullable: true,
            default: null,
            comment: 'Cuando el suscriptor se elimina de la sala, se guarda la fecha de eliminación. Y cunado vuelve a suscribirse, se actualiza la fecha de eliminación a null'
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn("suscriptores_salas_chat", "fecha_eliminacion");
    }
}
exports.AddFechaEliminacionSuscriptoresSalasChat1754938672348 = AddFechaEliminacionSuscriptoresSalasChat1754938672348;
//# sourceMappingURL=1754938672348-AddFechaEliminacionSuscriptoresSalasChat.js.map