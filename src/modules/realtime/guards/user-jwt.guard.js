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
exports.UserJwtGuard = void 0;
const common_1 = require("@nestjs/common");
const issuer_jwt_service_1 = require("../services/issuer-jwt.service");
let UserJwtGuard = class UserJwtGuard {
    constructor(issuerJwtService) {
        this.issuerJwtService = issuerJwtService;
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
        const identity = this.issuerJwtService.verify(token);
        if (!identity) {
            throw new common_1.UnauthorizedException('Token inválido o expirado');
        }
        request.identity = identity;
        return true;
    }
};
exports.UserJwtGuard = UserJwtGuard;
exports.UserJwtGuard = UserJwtGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [issuer_jwt_service_1.IssuerJwtService])
], UserJwtGuard);
//# sourceMappingURL=user-jwt.guard.js.map