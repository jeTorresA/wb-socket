"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const realtime_1 = require("../modules/realtime");
const diagnostics_1 = require("./diagnostics");
const DB_CHECK_TIMEOUT_MS = 3000;
let HealthController = class HealthController {
    constructor(dataSource, socketServerProvider) {
        this.dataSource = dataSource;
        this.socketServerProvider = socketServerProvider;
    }
    io() {
        return this.socketServerProvider.isInitialized() ? this.socketServerProvider.getServer() : undefined;
    }
    live() {
        return { status: 'ok', ...(0, diagnostics_1.runtimeSnapshot)({ dataSource: this.dataSource, io: this.io() }) };
    }
    async db(res) {
        const start = Date.now();
        let timer;
        try {
            await Promise.race([
                this.dataSource.query('SELECT 1'),
                new Promise((_, reject) => {
                    timer = setTimeout(() => reject(new Error(`timeout ${DB_CHECK_TIMEOUT_MS}ms`)), DB_CHECK_TIMEOUT_MS);
                }),
            ]);
            res.status(common_1.HttpStatus.OK).json({
                status: 'ok',
                latencyMs: Date.now() - start,
                ...(0, diagnostics_1.runtimeSnapshot)({ dataSource: this.dataSource, io: this.io() }),
            });
        }
        catch (error) {
            res.status(common_1.HttpStatus.SERVICE_UNAVAILABLE).json({
                status: 'error',
                error: error?.message ?? String(error),
                latencyMs: Date.now() - start,
                ...(0, diagnostics_1.runtimeSnapshot)({ dataSource: this.dataSource, io: this.io() }),
            });
        }
        finally {
            clearTimeout(timer);
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "live", null);
__decorate([
    (0, common_1.Get)('db'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "db", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        realtime_1.SocketServerProvider])
], HealthController);
//# sourceMappingURL=health.controller.js.map