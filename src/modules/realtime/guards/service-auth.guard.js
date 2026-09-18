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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ServiceAuthGuard = class ServiceAuthGuard {
    constructor(configService) {
        this.configService = configService;
        this.serviceToken = this.configService.get('SERVICE_AUTH_TOKEN');
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        if (!authHeader) {
            throw new common_1.UnauthorizedException('Token de autorización requerido');
        }
        const [bearer, token] = authHeader.split(' ');
        if (bearer !== 'Bearer' || !token) {
            throw new common_1.UnauthorizedException('Formato de token inválido. Use: Bearer TOKEN');
        }
        if (!this.serviceToken) {
            throw new common_1.UnauthorizedException('Servicio no configurado correctamente');
        }
        if (token !== this.serviceToken) {
            throw new common_1.UnauthorizedException('Token de servicio inválido');
        }
        return true;
    }
};
exports.ServiceAuthGuard = ServiceAuthGuard;
exports.ServiceAuthGuard = ServiceAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ServiceAuthGuard);
//# sourceMappingURL=service-auth.guard.js.map