import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config(); // Carga .env

export const dataBaseOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  entities: [join(__dirname, '..', 'src', 'entities', '*.entity.{ts,js}')],
  migrations: [join(__dirname, 'migrations', '*{.ts,.js}')],
  // Cambia el nombre de la tabla de migraciones para TypeORM. Para evitar colisiones con la tabla migrations de Laravel
  migrationsTableName: 'typeorm_migrations',
};

export default new DataSource(dataBaseOptions);