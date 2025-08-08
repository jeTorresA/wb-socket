import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddTipoToSalasChat1754663687709 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("salas_chat", new TableColumn({
            name: "tipo",
            type: "int",
            isNullable: false,
            default: 1,
            comment: '1:chat simple-2:grupo'
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("salas_chat", "tipo");
    }

}