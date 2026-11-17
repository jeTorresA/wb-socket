import { Response } from 'express';
import { DataSource } from 'typeorm';
import { SocketServerProvider } from 'src/modules/realtime';
export declare class HealthController {
    private readonly dataSource;
    private readonly socketServerProvider;
    constructor(dataSource: DataSource, socketServerProvider: SocketServerProvider);
    private io;
    live(): {
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
        status: string;
    };
    db(res: Response): Promise<void>;
}
