"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlignChatColumnTypes1790359200000 = void 0;
class AlignChatColumnTypes1790359200000 {
    async up(queryRunner) {
        await this.dropFkIfExists(queryRunner, "suscriptores_salas_chat", "id_sala", "salas_chat");
        await this.dropFkIfExists(queryRunner, "mensajes_chat", "id_sala", "salas_chat");
        await this.dropFkIfExists(queryRunner, "archivos_chat", "id_mensaje", "mensajes_chat");
        await this.dropFkIfExists(queryRunner, "mensajes_chat", "id_user", "suscriptores_salas_chat");
        await queryRunner.query("ALTER TABLE `salas_chat` MODIFY `creador` varchar(100) NOT NULL");
        await queryRunner.query("ALTER TABLE `suscriptores_salas_chat` MODIFY `id_user` varchar(100) NOT NULL");
        await queryRunner.query("ALTER TABLE `suscriptores_salas_chat` MODIFY `id_sala` varchar(36) NOT NULL");
        await queryRunner.query("ALTER TABLE `mensajes_chat` MODIFY `id_sala` varchar(36) NOT NULL");
        await queryRunner.query("ALTER TABLE `mensajes_chat` MODIFY `id_user` varchar(100) NOT NULL");
        await queryRunner.query("ALTER TABLE `mensajes_chat` MODIFY `userName` varchar(100) NOT NULL");
        await queryRunner.query("ALTER TABLE `archivos_chat` MODIFY `id_mensaje` varchar(36) NOT NULL");
        await queryRunner.query("ALTER TABLE `archivos_chat` MODIFY `id_user` varchar(100) NOT NULL");
        await this.addForeignKeys(queryRunner);
    }
    async down(queryRunner) {
        await this.dropFkIfExists(queryRunner, "suscriptores_salas_chat", "id_sala", "salas_chat");
        await this.dropFkIfExists(queryRunner, "mensajes_chat", "id_sala", "salas_chat");
        await this.dropFkIfExists(queryRunner, "archivos_chat", "id_mensaje", "mensajes_chat");
        await queryRunner.query("ALTER TABLE `salas_chat` MODIFY `creador` varchar(20) NOT NULL");
        await queryRunner.query("ALTER TABLE `suscriptores_salas_chat` MODIFY `id_user` varchar(20) NOT NULL");
        await queryRunner.query("ALTER TABLE `suscriptores_salas_chat` MODIFY `id_sala` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `mensajes_chat` MODIFY `id_sala` varchar(50) NOT NULL");
        await queryRunner.query("ALTER TABLE `mensajes_chat` MODIFY `id_user` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `mensajes_chat` MODIFY `userName` varchar(50) NOT NULL");
        await queryRunner.query("ALTER TABLE `archivos_chat` MODIFY `id_mensaje` varchar(50) NOT NULL");
        await queryRunner.query("ALTER TABLE `archivos_chat` MODIFY `id_user` varchar(20) NOT NULL");
        await this.addForeignKeys(queryRunner);
    }
    async addForeignKeys(queryRunner) {
        await queryRunner.query("SET FOREIGN_KEY_CHECKS = 0");
        try {
            await queryRunner.query("ALTER TABLE `suscriptores_salas_chat` ADD CONSTRAINT `FK_9755ebb4007952bc6c660e68ee8` " +
                "FOREIGN KEY (`id_sala`) REFERENCES `salas_chat`(`id_sala`) ON DELETE CASCADE ON UPDATE CASCADE");
            await queryRunner.query("ALTER TABLE `mensajes_chat` ADD CONSTRAINT `FK_4ae3d3eb75e8deeca5b60bcf750` " +
                "FOREIGN KEY (`id_sala`) REFERENCES `salas_chat`(`id_sala`) ON DELETE CASCADE ON UPDATE CASCADE");
            await queryRunner.query("ALTER TABLE `archivos_chat` ADD CONSTRAINT `FK_c56dbfb3387bb619b6acb0e887c` " +
                "FOREIGN KEY (`id_mensaje`) REFERENCES `mensajes_chat`(`id`) ON DELETE CASCADE ON UPDATE CASCADE");
        }
        finally {
            await queryRunner.query("SET FOREIGN_KEY_CHECKS = 1");
        }
    }
    async dropFkIfExists(queryRunner, table, column, referencedTable) {
        const rows = await queryRunner.query(`SELECT CONSTRAINT_NAME
               FROM information_schema.KEY_COLUMN_USAGE
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = ?
                AND COLUMN_NAME = ?
                AND REFERENCED_TABLE_NAME = ?`, [table, column, referencedTable]);
        if (rows.length) {
            await queryRunner.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${rows[0].CONSTRAINT_NAME}\``);
        }
    }
}
exports.AlignChatColumnTypes1790359200000 = AlignChatColumnTypes1790359200000;
//# sourceMappingURL=1790359200000-AlignChatColumnTypes.js.map