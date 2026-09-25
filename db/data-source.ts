import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config(); // Carga .env

export const dataBaseOptions: DataSourceOptions = {
  type: 'mysql',
  // Fuerza el driver mysql2 (mantenido). Sin esto TypeORM usa "mysql" legacy.
  connectorPackage: 'mysql2',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  // Límite de conexiones del pool por proceso (TypeORM lo mapea a connectionLimit)
  poolSize: Number(process.env.DB_POOL_SIZE ?? 10),
  entities: [join(__dirname, '..', 'src', 'entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  // Cambia el nombre de la tabla de migraciones para TypeORM. Para evitar colisiones con la tabla migrations de Laravel
  migrationsTableName: 'typeorm_migrations',
  extra: {
    // Opciones de mysql2: evitan que las conexiones idle queden abiertas indefinidamente
    maxIdle: Number(process.env.DB_POOL_MAX_IDLE ?? 4),
    idleTimeout: Number(process.env.DB_POOL_IDLE_TIMEOUT ?? 60000),
    queueLimit: 0,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  },
};

export default new DataSource(dataBaseOptions);