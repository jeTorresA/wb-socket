import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddFechaEliminacionSuscriptoresSalasChat1754938672348 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("suscriptores_salas_chat", new TableColumn({
            name: "fecha_eliminacion",
            type: "timestamp",
            isNullable: true,
            default: null,
            comment: 'Cuando el suscriptor se elimina de la sala, se guarda la fecha de eliminación. Y cunado vuelve a suscribirse, se actualiza la fecha de eliminación a null'
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("suscriptores_salas_chat", "fecha_eliminacion");
    }

}
