import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddNamespaceToUserConected1770389717496 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('user_conected', new TableColumn({
            name: "namespace",
            type: "varchar",
            length: "100",
            isNullable: true,
            default: null,
            comment: 'Para diferenciar el canal al que escuchará el cliente'        
        }));    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("user_conected", "namespace");
    }

}
