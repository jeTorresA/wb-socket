import { MigrationInterface, QueryRunner } from "typeorm";

export class WidenUserConectedUserColumns1790359000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Los ids se califican por emisor (p. ej. "repotencia:1007507657") y superan
        // los 20 caracteres: se amplían las columnas para que no se trunquen
        await queryRunner.query(`ALTER TABLE \`user_conected\` MODIFY \`userId\` varchar(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user_conected\` MODIFY \`userName\` varchar(100) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_conected\` MODIFY \`userId\` varchar(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user_conected\` MODIFY \`userName\` varchar(20) NOT NULL`);
    }

}
