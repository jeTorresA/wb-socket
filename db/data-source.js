"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataBaseOptions = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const path_1 = require("path");
(0, dotenv_1.config)();
exports.dataBaseOptions = {
    type: 'mysql',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT),
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    entities: [(0, path_1.join)(__dirname, '..', 'src', 'entities', '*.entity.{ts,js}')],
    migrations: [(0, path_1.join)(__dirname, 'migrations', '*{.ts,.js}')],
    migrationsTableName: 'typeorm_migrations',
};
exports.default = new typeorm_1.DataSource(exports.dataBaseOptions);
//# sourceMappingURL=data-source.js.map