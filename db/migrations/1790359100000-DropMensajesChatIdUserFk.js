"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropMensajesChatIdUserFk1790359100000 = void 0;
class DropMensajesChatIdUserFk1790359100000 {
    async up(queryRunner) {
        const [fk] = await queryRunner.query(`
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'mensajes_chat'
              AND REFERENCED_TABLE_NAME = 'suscriptores_salas_chat'
        `);
        if (fk) {
            await queryRunner.query(`ALTER TABLE \`mensajes_chat\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
        }
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`mensajes_chat\` ADD CONSTRAINT \`FK_mensajes_chat_id_user\`
             FOREIGN KEY (\`id_user\`) REFERENCES \`suscriptores_salas_chat\` (\`id_user\`)
             ON DELETE CASCADE ON UPDATE CASCADE`);
    }
}
exports.DropMensajesChatIdUserFk1790359100000 = DropMensajesChatIdUserFk1790359100000;
//# sourceMappingURL=1790359100000-DropMensajesChatIdUserFk.js.map