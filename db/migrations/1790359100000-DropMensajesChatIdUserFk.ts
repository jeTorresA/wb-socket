import { MigrationInterface, QueryRunner } from "typeorm";

export class DropMensajesChatIdUserFk1790359100000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // La FK mensajes_chat.id_user -> suscriptores_salas_chat.id_user estaba en CASCADE:
        // borrar una suscripción (p. ej. al eliminar una sala) eliminaba TODOS los mensajes
        // de ese usuario en todas las salas. Se elimina la restricción.
        const [fk] = await queryRunner.query(`
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'mensajes_chat'
              AND REFERENCED_TABLE_NAME = 'suscriptores_salas_chat'
        `);

        if (fk) {
            await queryRunner.query(
                `ALTER TABLE \`mensajes_chat\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`mensajes_chat\` ADD CONSTRAINT \`FK_mensajes_chat_id_user\`
             FOREIGN KEY (\`id_user\`) REFERENCES \`suscriptores_salas_chat\` (\`id_user\`)
             ON DELETE CASCADE ON UPDATE CASCADE`
        );
    }

}
