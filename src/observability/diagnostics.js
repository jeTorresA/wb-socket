"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
exports.dbPoolStats = dbPoolStats;
exports.attachSocketDiagnostics = attachSocketDiagnostics;
exports.attachHttpServerDiagnostics = attachHttpServerDiagnostics;
exports.runtimeSnapshot = runtimeSnapshot;
exports.startHeartbeat = startHeartbeat;
exports.installProcessHandlers = installProcessHandlers;
const common_1 = require("@nestjs/common");
const perf_hooks_1 = require("perf_hooks");
const logger = new common_1.Logger('Diag');
const env = (name, def) => {
    const v = Number(process.env[name]);
    return Number.isFinite(v) && v > 0 ? v : def;
};
const INTERVAL_MS = env('DIAG_INTERVAL_MS', 60000);
const SLOW_MS = env('DIAG_SLOW_MS', 5000);
const LAG_WARN_MS = env('DIAG_LAG_WARN_MS', 500);
const LOG_ALL = process.env.DIAG_LOG_ALL_REQUESTS === 'true';
const inflight = new Map();
let requestSeq = 0;
function safeUrl(url) {
    const [path, qs] = url.split('?');
    if (!qs)
        return path;
    const params = new URLSearchParams(qs);
    for (const key of ['token', 'access_token', 'auth']) {
        if (params.has(key))
            params.set(key, '***');
    }
    return `${path}?${params.toString()}`;
}
function requestLogger(req, res, next) {
    const entry = {
        id: ++requestSeq,
        method: req.method,
        url: safeUrl(req.originalUrl || req.url),
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '?',
        start: Date.now(),
    };
    inflight.set(entry.id, entry);
    const isSocketIo = entry.url.startsWith('/socket.io');
    res.on('close', () => {
        inflight.delete(entry.id);
        const ms = Date.now() - entry.start;
        const line = `#${entry.id} ${entry.method} ${entry.url} ${res.statusCode} ${ms}ms ip=${entry.ip}`;
        if (!res.writableFinished) {
            logger.warn(`PETICIÓN ABORTADA SIN RESPUESTA ${line}`);
        }
        else if (res.statusCode >= 500) {
            logger.error(`HTTP ${line}`);
        }
        else if (ms >= SLOW_MS) {
            logger.warn(`PETICIÓN LENTA ${line}`);
        }
        else if (LOG_ALL || (!isSocketIo && res.statusCode >= 400)) {
            logger.log(`HTTP ${line}`);
        }
    });
    next();
}
function trackRawSocketIoRequests(server) {
    server.prependListener('request', (req, res) => {
        if (!req.url?.startsWith('/socket.io'))
            return;
        requestLogger(req, res, () => undefined);
    });
}
function inflightSummary() {
    let oldest;
    for (const r of inflight.values()) {
        if (!oldest || r.start < oldest.start)
            oldest = r;
    }
    return {
        count: inflight.size,
        oldest: oldest
            ? `${oldest.method} ${oldest.url} hace ${Date.now() - oldest.start}ms`
            : null,
    };
}
let histogram;
function startEventLoopWatch() {
    histogram = (0, perf_hooks_1.monitorEventLoopDelay)({ resolution: 20 });
    histogram.enable();
    let expected = Date.now() + 1000;
    setInterval(() => {
        const drift = Date.now() - expected;
        if (drift > LAG_WARN_MS) {
            logger.error(`EVENT LOOP BLOQUEADO ~${drift}ms (inflight=${inflight.size})`);
        }
        expected = Date.now() + 1000;
    }, 1000).unref();
}
function eventLoopStats() {
    if (!histogram)
        return null;
    const ms = (ns) => Math.round(ns / 1e6);
    const stats = {
        p50: ms(histogram.percentile(50)),
        p99: ms(histogram.percentile(99)),
        max: ms(histogram.max),
    };
    histogram.reset();
    return stats;
}
function dbPoolStats(dataSource) {
    try {
        const pool = dataSource?.driver?.pool;
        if (!pool)
            return null;
        const len = (x) => (x == null ? null : x.length ?? null);
        return {
            limit: pool.config?.connectionLimit ?? null,
            total: len(pool._allConnections),
            free: len(pool._freeConnections),
            queued: len(pool._connectionQueue),
        };
    }
    catch {
        return null;
    }
}
function socketStats(io) {
    if (!io)
        return null;
    try {
        return {
            engineClients: io.engine?.clientsCount ?? null,
            chat: io.of('/chat').sockets.size,
            notifications: io.of('/notifications').sockets.size,
        };
    }
    catch {
        return null;
    }
}
function attachSocketDiagnostics(io) {
    io.engine.on('connection_error', (err) => {
        const req = err.req;
        logger.warn(`SOCKET.IO connection_error code=${err.code} msg="${err.message}" ` +
            `url=${safeUrl(req?.url ?? '?')} ip=${req?.headers?.['x-forwarded-for'] ?? req?.socket?.remoteAddress ?? '?'} ` +
            `ctx=${JSON.stringify(err.context ?? {})}`);
    });
}
function attachHttpServerDiagnostics(server) {
    trackRawSocketIoRequests(server);
    server.on('tlsClientError', (err, socket) => {
        logger.warn(`TLS CLIENT ERROR ${err?.code ?? ''} ${err?.message} ip=${socket?.remoteAddress ?? '?'}`);
    });
    server.on('clientError', (err, socket) => {
        logger.warn(`HTTP CLIENT ERROR ${err?.code ?? ''} ${err?.message} ip=${socket?.remoteAddress ?? '?'}`);
        if (socket?.writable)
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
    logger.log(`HTTP timeouts: keepAlive=${server.keepAliveTimeout}ms headers=${server.headersTimeout}ms ` +
        `request=${server.requestTimeout ?? 'n/a'}ms`);
}
function runtimeSnapshot(deps) {
    const mem = process.memoryUsage();
    const mb = (n) => Math.round(n / 1024 / 1024);
    return {
        pid: process.pid,
        uptimeSec: Math.round(process.uptime()),
        node: process.version,
        memMB: { rss: mb(mem.rss), heapUsed: mb(mem.heapUsed), heapTotal: mb(mem.heapTotal) },
        eventLoopLagMs: histogram
            ? { p50: Math.round(histogram.percentile(50) / 1e6), p99: Math.round(histogram.percentile(99) / 1e6), max: Math.round(histogram.max / 1e6) }
            : null,
        inflight: inflightSummary(),
        dbPool: dbPoolStats(deps.dataSource),
        dbInitialized: deps.dataSource?.isInitialized ?? null,
        sockets: socketStats(deps.io),
    };
}
function startHeartbeat(deps) {
    setInterval(() => {
        const lag = eventLoopStats();
        const snapshot = { ...runtimeSnapshot({ dataSource: deps.dataSource, io: deps.getIo() }), eventLoopLagMs: lag };
        const pool = snapshot.dbPool;
        const unhealthy = (lag && lag.p99 > LAG_WARN_MS) ||
            (pool && pool.queued > 0) ||
            snapshot.inflight.count > 50 ||
            snapshot.dbInitialized === false;
        const msg = `HEARTBEAT ${JSON.stringify(snapshot)}`;
        if (unhealthy)
            logger.warn(msg);
        else
            logger.log(msg);
    }, INTERVAL_MS).unref();
}
function installProcessHandlers() {
    startEventLoopWatch();
    process.on('unhandledRejection', (reason) => {
        logger.error(`UNHANDLED REJECTION ${reason?.stack ?? reason}`);
    });
    process.on('uncaughtException', (err) => {
        logger.error(`UNCAUGHT EXCEPTION ${err?.stack ?? err}`);
        process.exit(1);
    });
    process.on('warning', (w) => logger.warn(`PROCESS WARNING ${w.name}: ${w.message}`));
    process.on('exit', (code) => console.error(`[Diag] PROCESO TERMINANDO code=${code}`));
}
//# sourceMappingURL=diagnostics.js.map