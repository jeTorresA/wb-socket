import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AlignChatColumnTypes1790359200000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
    private addForeignKeys;
    private dropFkIfExists;
}
