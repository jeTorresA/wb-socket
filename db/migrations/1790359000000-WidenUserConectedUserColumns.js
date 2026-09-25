"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WidenUserConectedUserColumns1790359000000 = void 0;
class WidenUserConectedUserColumns1790359000000 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`user_conected\` MODIFY \`userId\` varchar(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user_conected\` MODIFY \`userName\` varchar(100) NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`user_conected\` MODIFY \`userId\` varchar(20) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`user_conected\` MODIFY \`userName\` varchar(20) NOT NULL`);
    }
}
exports.WidenUserConectedUserColumns1790359000000 = WidenUserConectedUserColumns1790359000000;
//# sourceMappingURL=1790359000000-WidenUserConectedUserColumns.js.map