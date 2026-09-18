"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddNamespaceToUserConected1770389717496 = void 0;
const typeorm_1 = require("typeorm");
class AddNamespaceToUserConected1770389717496 {
    async up(queryRunner) {
        await queryRunner.addColumn('user_conected', new typeorm_1.TableColumn({
            name: "namespace",
            type: "varchar",
            length: "100",
            isNullable: true,
            default: null,
            comment: 'Para diferenciar el canal al que escuchará el cliente'
        }));
    }
    async down(queryRunner) {
        await queryRunner.dropColumn("user_conected", "namespace");
    }
}
exports.AddNamespaceToUserConected1770389717496 = AddNamespaceToUserConected1770389717496;
//# sourceMappingURL=1770389717496-AddNamespaceToUserConected.js.map