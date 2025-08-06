import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FilesModule } from './files/files.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ApiController } from './api/api.controller';
import { ChatGateway } from './chat/chat.gateway';

@Module({
  imports: [
    ChatModule,
    FilesModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      database: process.env.DATABASE_NAME,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      entities: [__dirname + '/entities/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: process.env.NODE_ENV === 'development',
      autoLoadEntities:  process.env.NODE_ENV === 'development',
    }),
    MulterModule.register({
      dest: '../public/uploads',
    }),
    ServeStaticModule.forRoot({ rootPath: join(process.cwd(), 'client'), }),
  ],
  controllers: [AppController, ApiController],
  providers: [AppService],
})
export class AppModule {}
