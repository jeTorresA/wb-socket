"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const express_1 = require("express");
const fs = require("fs");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const typeorm_1 = require("typeorm");
const realtime_1 = require("./modules/realtime");
const diagnostics_1 = require("./observability/diagnostics");
const logger = new common_1.Logger('Bootstrap');
async function bootstrap() {
    (0, diagnostics_1.installProcessHandlers)();
    const PORT = Number(process.env.PORT || 3009);
    const t0 = Date.now();
    logger.log(`ARRANQUE pid=${process.pid} node=${process.version} NODE_ENV=${process.env.NODE_ENV} cwd=${process.cwd()} ` +
        `db=${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`);
    const key = process.env.NODE_ENV === 'production' ? 'config/keys/llave.key' : 'config/keys/private.key';
    const crt = process.env.NODE_ENV === 'production' ? 'config/keys/certificado.crt' : 'config/keys/certificate.crt';
    const httpsOptions = {
        key: fs.readFileSync(key),
        cert: fs.readFileSync(crt),
    };
    logger.log(`Certificados TLS cargados (${key}, ${crt})`);
    logger.log('Creando aplicación Nest (incluye conexión a la BD)...');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { httpsOptions, cors: true });
    logger.log(`Aplicación creada en ${Date.now() - t0}ms`);
    app.use(diagnostics_1.requestLogger);
    app.use((0, express_1.json)({ limit: '60mb' }));
    app.enableCors({
        origin: ['http://localhost:3009', 'https://www.repotencia.com', 'http:repotencia.local', 'http://192.168.2.80', 'http://192.168.2.80:4900'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    });
    app.useWebSocketAdapter(new platform_socket_io_1.IoAdapter(app));
    await app.listen(PORT);
    logger.log(`ESCUCHANDO en https://0.0.0.0:${PORT} (arranque total ${Date.now() - t0}ms)`);
    (0, diagnostics_1.attachHttpServerDiagnostics)(app.getHttpServer());
    const socketServerProvider = app.get(realtime_1.SocketServerProvider);
    if (socketServerProvider.isInitialized()) {
        (0, diagnostics_1.attachSocketDiagnostics)(socketServerProvider.getServer());
    }
    else {
        logger.error('Socket.IO NO quedó inicializado tras listen(): los gateways no se registraron');
    }
    (0, diagnostics_1.startHeartbeat)({
        dataSource: app.get(typeorm_1.DataSource),
        getIo: () => (socketServerProvider.isInitialized() ? socketServerProvider.getServer() : undefined),
    });
    const shutdown = async (signal) => {
        logger.log(`${signal} recibido: cerrando servidor y pool de base de datos...`);
        await app.close();
        logger.log('Servidor cerrado y pool de conexiones liberado');
        process.exit(0);
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
}
bootstrap().catch((error) => {
    logger.error(`ARRANQUE FALLIDO: ${error?.stack ?? error}`);
    process.exit(1);
});
//# sourceMappingURL=main.js.map