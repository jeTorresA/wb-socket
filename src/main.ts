import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';
import * as fs from 'fs';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const PORT = process.env.PORT || 3009;
  
  const key = process.env.NODE_ENV === 'production' ? 'config/keys/llave.key' : 'config/keys/private.key';
  const crt = process.env.NODE_ENV === 'production' ? 'config/keys/certificado.crt' : 'config/keys/certificate.crt';

  const httpsOptions = {
    key: fs.readFileSync(key),
    cert: fs.readFileSync(crt),
  };

  const app = await NestFactory.create(AppModule, { httpsOptions, cors: true });
  app.use(json({ limit: '60mb' }));
  // app.enableVersioning({ defaultVersion: '1', type: VersioningType.URI });
  app.enableCors({
    origin: ['http://localhost:3009', 'https://www.repotencia.com', 'http:repotencia.local', 'http://192.168.2.80', 'http://192.168.2.80:4900'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(3009);
  console.log('Listen on port ', PORT);

  // Cierre ordenado: app.close() dispara onApplicationShutdown de @nestjs/typeorm,
  // que ejecuta dataSource.destroy() -> pool.end(), liberando las conexiones a BD.
  const shutdown = async (signal: NodeJS.Signals) => {
    console.info(`${signal} recibido: cerrando servidor y pool de base de datos...`);
    await app.close();
    console.info('Servidor cerrado y pool de conexiones liberado');
    process.exit(0);
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}
bootstrap();