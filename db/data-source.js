"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataBaseOptions = void 0;
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const path_1 = require("path");
(0, dotenv_1.config)();
exports.dataBaseOptions = {
    type: 'mysql',
    connectorPackage: 'mysql2',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT),
    database: process.env.DATABASE_NAME,
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    poolSize: Number(process.env.DB_POOL_SIZE ?? 10),
    entities: [(0, path_1.join)(__dirname, '..', 'src', 'entities', '*.entity.{ts,js}')],
    migrations: [(0, path_1.join)(__dirname, 'migrations', '*{.ts,.js}')],
    migrationsTableName: 'typeorm_migrations',
    extra: {
        maxIdle: Number(process.env.DB_POOL_MAX_IDLE ?? 4),
        idleTimeout: Number(process.env.DB_POOL_IDLE_TIMEOUT ?? 60000),
        queueLimit: 0,
        connectTimeout: 10000,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
    },
};
exports.default = new typeorm_1.DataSource(exports.dataBaseOptions);
//# sourceMappingURL=data-source.js.map