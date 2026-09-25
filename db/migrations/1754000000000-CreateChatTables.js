"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateChatTables1754000000000 = void 0;
const typeorm_1 = require("typeorm");
class CreateChatTables1754000000000 {
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: "salas_chat",
            columns: [
                { name: "id_sala", type: "varchar", length: "36", isPrimary: true },
                { name: "nombre_sala", type: "varchar", length: "100", isNullable: false },
                { name: "creador", type: "varchar", length: "20", isNullable: false },
                { name: "fecha_creacion", type: "timestamp", isNullable: false, default: "CURRENT_TIMESTAMP" },
            ],
            indices: [
                { name: "IDX_52d6de74024c843bd7c0ce7b94", columnNames: ["nombre_sala"], isUnique: true },
            ],
        }), true);
        await queryRunner.createTable(new typeorm_1.Table({
            name: "user_conected",
            columns: [
                { name: "id", type: "varchar", length: "36", isPrimary: true },
                { name: "userId", type: "varchar", length: "20", isNullable: false },
                { name: "userName", type: "varchar", length: "20", isNullable: false },
                { name: "client", type: "json", isNullable: false },
            ],
        }), true);
        await queryRunner.createTable(new typeorm_1.Table({
            name: "suscriptores_salas_chat",
            columns: [
                { name: "id_user", type: "varchar", length: "20", isPrimary: true },
                { name: "id_sala", type: "varchar", length: "255", isPrimary: true },
                { name: "nombre_sala", type: "varchar", length: "100", isNullable: false },
                { name: "imagen_sala", type: "varchar", length: "30", isNullable: false },
                { name: "mensajes_por_leer", type: "int", isNullable: false },
                { name: "fecha_suscripcion", type: "timestamp", isNullable: false, default: "CURRENT_TIMESTAMP" },
            ],
            foreignKeys: [
                {
                    name: "FK_9755ebb4007952bc6c660e68ee8",
                    columnNames: ["id_sala"],
                    referencedTableName: "salas_chat",
                    referencedColumnNames: ["id_sala"],
                    onDelete: "CASCADE",
                    onUpdate: "CASCADE",
                },
            ],
        }), true);
        await queryRunner.createTable(new typeorm_1.Table({
            name: "mensajes_chat",
            columns: [
                { name: "id", type: "varchar", length: "36", isPrimary: true },
                { name: "id_sala", type: "varchar", length: "50", isNullable: false },
                { name: "message", type: "varchar", length: "450", isNullable: false },
                {
                    name: "archivos",
                    type: "json",
                    isNullable: true,
                    comment: "contiene la lista de archivos del mensaje si los hay",
                },
                { name: "id_user", type: "varchar", length: "255", isNullable: false },
                { name: "userName", type: "varchar", length: "50", isNullable: false },
                { name: "fecha_creacion", type: "timestamp", isNullable: false, default: "CURRENT_TIMESTAMP" },
            ],
            foreignKeys: [
                {
                    name: "FK_b19663163c31664357a04cf5fc0",
                    columnNames: ["id_user"],
                    referencedTableName: "suscriptores_salas_chat",
                    referencedColumnNames: ["id_user"],
                    onDelete: "CASCADE",
                    onUpdate: "CASCADE",
                },
                {
                    name: "FK_4ae3d3eb75e8deeca5b60bcf750",
                    columnNames: ["id_sala"],
                    referencedTableName: "salas_chat",
                    referencedColumnNames: ["id_sala"],
                    onDelete: "CASCADE",
                    onUpdate: "CASCADE",
                },
            ],
        }), true);
        await queryRunner.createTable(new typeorm_1.Table({
            name: "archivos_chat",
            columns: [
                { name: "id", type: "varchar", length: "36", isPrimary: true },
                { name: "nombre", type: "varchar", length: "11", isNullable: false },
                { name: "id_mensaje", type: "varchar", length: "50", isNullable: false },
                { name: "id_user", type: "varchar", length: "20", isNullable: false },
                { name: "ubicacion", type: "varchar", length: "200", isNullable: false },
            ],
            indices: [
                { name: "REL_c56dbfb3387bb619b6acb0e887", columnNames: ["id_mensaje"], isUnique: true },
            ],
            foreignKeys: [
                {
                    name: "FK_c56dbfb3387bb619b6acb0e887c",
                    columnNames: ["id_mensaje"],
                    referencedTableName: "mensajes_chat",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE",
                    onUpdate: "CASCADE",
                },
            ],
        }), true);
    }
    async down(queryRunner) {
        await queryRunner.dropTable("archivos_chat", true);
        await queryRunner.dropTable("mensajes_chat", true);
        await queryRunner.dropTable("suscriptores_salas_chat", true);
        await queryRunner.dropTable("user_conected", true);
        await queryRunner.dropTable("salas_chat", true);
    }
}
exports.CreateChatTables1754000000000 = CreateChatTables1754000000000;
//# sourceMappingURL=1754000000000-CreateChatTables.js.map