import { Request, Response, NextFunction } from 'express';
import type { Server as HttpServer } from 'http';
import type { Server as IoServer } from 'socket.io';
import type { DataSource } from 'typeorm';
export declare function requestLogger(req: Request, res: Response, next: NextFunction): void;
export declare function dbPoolStats(dataSource?: DataSource): {
    limit: any;
    total: any;
    free: any;
    queued: any;
};
export declare function attachSocketDiagnostics(io: IoServer): void;
export declare function attachHttpServerDiagnostics(server: HttpServer): void;
export declare function runtimeSnapshot(deps: {
    dataSource?: DataSource;
    io?: IoServer;
}): {
    pid: number;
    uptimeSec: number;
    node: string;
    memMB: {
        rss: number;
        heapUsed: number;
        heapTotal: number;
    };
    eventLoopLagMs: {
        p50: number;
        p99: number;
        max: number;
    };
    inflight: {
        count: number;
        oldest: string;
    };
    dbPool: {
        limit: any;
        total: any;
        free: any;
        queued: any;
    };
    dbInitialized: boolean;
    sockets: {
        engineClients: number;
        chat: number;
        notifications: number;
    };
};
export declare function startHeartbeat(deps: {
    dataSource?: DataSource;
    getIo: () => IoServer | undefined;
}): void;
export declare function installProcessHandlers(): void;
