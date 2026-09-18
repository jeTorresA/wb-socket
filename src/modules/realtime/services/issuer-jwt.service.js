"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssuerJwtService = void 0;
const common_1 = require("@nestjs/common");
const jwt = require("jsonwebtoken");
const fs = require("fs");
function getPath(obj, path) {
    return path
        .split('.')
        .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}
let IssuerJwtService = class IssuerJwtService {
    constructor() {
        this.issuers = [];
    }
    onModuleInit() {
        const raw = process.env.JWT_ISSUERS;
        if (!raw) {
            throw new Error('JWT_ISSUERS no está configurado (lista JSON de emisores confiables)');
        }
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch (error) {
            throw new Error(`JWT_ISSUERS no es un JSON válido: ${error}`);
        }
        for (const issuer of parsed) {
            if (!issuer.iss || !issuer.algo || !issuer.idClaim) {
                throw new Error(`Emisor JWT inválido en JWT_ISSUERS: ${JSON.stringify(issuer)}`);
            }
            if (issuer.secret) {
                this.issuers.push({ ...issuer, key: issuer.secret });
            }
            else if (issuer.publicKey) {
                try {
                    this.issuers.push({ ...issuer, key: fs.readFileSync(issuer.publicKey, 'utf8') });
                }
                catch (error) {
                    throw new Error(`No se pudo leer la public key del emisor "${issuer.iss}": ${error}`);
                }
            }
            else {
                throw new Error(`El emisor "${issuer.iss}" no define secret ni publicKey`);
            }
        }
        console.info(`ISSUERS DE JWT CARGADOS: ${this.issuers.map(i => i.iss).join(', ')}`);
    }
    verify(token) {
        const decoded = jwt.decode(token, { complete: true });
        const payload = decoded?.payload;
        if (!payload) {
            console.warn(`TOKEN NO PARSEABLE (len=${token.length}, prefijo="${token.slice(0, 12)}")`);
            return null;
        }
        const payloadIss = typeof payload.iss === 'string' ? payload.iss : undefined;
        let candidates = payloadIss ? this.issuers.filter(i => i.iss === payloadIss) : [];
        if (candidates.length === 0 && payloadIss) {
            candidates = this.issuers.filter(i => payloadIss.startsWith(i.iss));
        }
        if (candidates.length === 0) {
            candidates = this.issuers;
        }
        for (const issuer of candidates) {
            try {
                jwt.verify(token, issuer.key, { algorithms: [issuer.algo] });
            }
            catch (error) {
                console.warn(`TOKEN RECHAZADO POR EMISOR "${issuer.iss}": ${error?.name ?? error}`);
                continue;
            }
            const userId = getPath(payload, issuer.idClaim);
            if (userId === undefined || userId === null || userId === '') {
                console.warn(`TOKEN VÁLIDO PERO SIN ${issuer.idClaim} EN EL EMISOR "${issuer.iss}"`);
                continue;
            }
            return {
                issuer: issuer.iss,
                userId: String(userId),
                userName: String(getPath(payload, issuer.nameClaim) ?? userId),
            };
        }
        return null;
    }
    qualify(identity) {
        return {
            userId: `${identity.issuer}:${identity.userId}`,
            userName: `${identity.issuer}:${identity.userName}`,
        };
    }
    middleware() {
        return (client, next) => {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');
            if (!token) {
                console.warn(`CONEXIÓN RECHAZADA (sin token): ${client.handshake.address}`);
                return next(new Error('unauthorized: token requerido'));
            }
            const identity = this.verify(token);
            if (!identity) {
                console.warn(`CONEXIÓN RECHAZADA (token inválido o expirado): ${client.handshake.address}`);
                return next(new Error('unauthorized: token inválido o expirado'));
            }
            client.data = { ...(client.data ?? {}), identity };
            next();
        };
    }
};
exports.IssuerJwtService = IssuerJwtService;
exports.IssuerJwtService = IssuerJwtService = __decorate([
    (0, common_1.Injectable)()
], IssuerJwtService);
//# sourceMappingURL=issuer-jwt.service.js.map