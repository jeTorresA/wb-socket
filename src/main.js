"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const express_1 = require("express");
const fs = require("fs");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
async function bootstrap() {
    const PORT = process.env.PORT || 3009;
    const key = process.env.NODE_ENV === 'production' ? 'config/keys/llave.key' : 'config/keys/private.key';
    const crt = process.env.NODE_ENV === 'production' ? 'config/keys/certificado.crt' : 'config/keys/certificate.crt';
    const httpsOptions = {
        key: fs.readFileSync(key),
        cert: fs.readFileSync(crt),
    };
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { httpsOptions, cors: true });
    app.use((0, express_1.json)({ limit: '60mb' }));
    app.enableCors({
        origin: ['http://localhost:3009', 'https://www.repotencia.com', 'http:repotencia.local', 'http://192.168.2.80', 'http://192.168.2.80:4900'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    });
    app.useWebSocketAdapter(new platform_socket_io_1.IoAdapter(app));
    await app.listen(3009);
    console.log('Listen on port ', PORT);
    const shutdown = async (signal) => {
        console.info(`${signal} recibido: cerrando servidor y pool de base de datos...`);
        await app.close();
        console.info('Servidor cerrado y pool de conexiones liberado');
        process.exit(0);
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
}
bootstrap();
//# sourceMappingURL=main.js.map