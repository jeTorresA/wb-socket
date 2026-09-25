import { Injectable, OnModuleInit } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import { Socket } from 'socket.io';

/**
 * Configuración de un emisor de JWT confiable (plataforma externa)
 */
export interface IssuerConfig {
  /** Claim estándar `iss` con el que la plataforma firma sus tokens */
  iss: string;
  /** Algoritmo de firma (RS256, HS256, ...) */
  algo: string;
  /** Clave pública (ruta al .pem) para algoritmos asimétricos */
  publicKey?: string;
  /** Secreto compartido, solo para algoritmos simétricos (HMAC) */
  secret?: string;
  /** JSON path del claim donde está el id del usuario (ej: "user.id_usuario") */
  idClaim: string;
  /** JSON path del claim con el nombre de usuario */
  nameClaim: string;
}

/** Identidad unificada derivada SIEMPRE del payload firmado del token */
export interface TokenIdentity {
  issuer: string;
  userId: string;
  userName: string;
}

/** Extrae un valor de un objeto por ruta de puntos (ej: "user.id_usuario") */
function getPath(obj: any, path: string): any {
  return path
    .split('.')
    .reduce((acc: any, key: string) => (acc == null ? undefined : acc[key]), obj);
}

/**
 * Valida JWTs firmados por múltiples plataformas (multi-emisor).
 * Cada emisor se declara en la variable de entorno JWT_ISSUERS con su clave
 * pública o secreto y el mapeo de sus claims de identidad.
 *
 * Clave compartida NUNCA: cada plataforma usa su propio par de claves (RS256)
 * o su propio secreto HS256; el servicio solo conoce la clave pública/saliente.
 */
@Injectable()
export class IssuerJwtService implements OnModuleInit {
  private issuers: (IssuerConfig & { key: string })[] = [];

  onModuleInit() {
    const raw = process.env.JWT_ISSUERS;
    if (!raw) {
      throw new Error('JWT_ISSUERS no está configurado (lista JSON de emisores confiables)');
    }

    let parsed: IssuerConfig[];
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`JWT_ISSUERS no es un JSON válido: ${error}`);
    }

    for (const issuer of parsed) {
      if (!issuer.iss || !issuer.algo || !issuer.idClaim) {
        throw new Error(`Emisor JWT inválido en JWT_ISSUERS: ${JSON.stringify(issuer)}`);
      }
      if (issuer.secret) {
        this.issuers.push({ ...issuer, key: issuer.secret });
      } else if (issuer.publicKey) {
        try {
          this.issuers.push({ ...issuer, key: fs.readFileSync(issuer.publicKey, 'utf8') });
        } catch (error) {
          throw new Error(`No se pudo leer la public key del emisor "${issuer.iss}": ${error}`);
        }
      } else {
        throw new Error(`El emisor "${issuer.iss}" no define secret ni publicKey`);
      }
    }

    console.info(`ISSUERS DE JWT CARGADOS: ${this.issuers.map(i => i.iss).join(', ')}`);
  }

  /**
   * Verifica un token contra el emisor declarado en su claim `iss`
   * (o probando emisores si no trae `iss`) y devuelve la identidad firmada.
   */
  verify(token: string): TokenIdentity | null {
    const decoded = jwt.decode(token, { complete: true });
    const payload = decoded?.payload as jwt.JwtPayload | undefined;
    if (!payload) {
      console.warn(`TOKEN NO PARSEABLE (len=${token.length}, prefijo="${token.slice(0, 12)}")`);
      return null;
    }

    const payloadIss = typeof payload.iss === 'string' ? payload.iss : undefined;

    // 1. Emisor cuyo `iss` coincide exactamente con el claim del token
    let candidates = payloadIss ? this.issuers.filter(i => i.iss === payloadIss) : [];

    // 2. Prefijo: algunos emisores (p. ej. tymon/jwt-auth) usan la URL de la petición como iss
    if (candidates.length === 0 && payloadIss) {
      candidates = this.issuers.filter(i => payloadIss.startsWith(i.iss));
    }

    // 3. Fallback: probar todos los emisores; la firma (RS256) decide sin ambigüedad
    if (candidates.length === 0) {
      candidates = this.issuers;
    }

    for (const issuer of candidates) {
      try {
        jwt.verify(token, issuer.key, { algorithms: [issuer.algo as jwt.Algorithm] });
      } catch (error: any) {
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

  /** Ids calificados por emisor: evitan colisiones entre plataformas */
  qualify(identity: TokenIdentity): { userId: string; userName: string } {
    return {
      userId: `${identity.issuer}:${identity.userId}`,
      userName: `${identity.issuer}:${identity.userName}`,
    };
  }

  /** Califica un id crudo con el emisor dado (para emitir a rooms `user:<iss>:<id>`) */
  qualifyUserId(issuer: string, userId: string): string {
    return `${issuer}:${userId}`;
  }

  /** Middleware de handshake de Socket.IO: valida el token y fija la identidad */
  middleware(): (client: Socket, next: (err?: Error) => void) => void {
    return (client: Socket, next: (err?: Error) => void) => {
      const token: string | undefined =
        client.handshake.auth?.token ||
        (client.handshake.headers?.authorization as string | undefined)?.replace(/^Bearer\s+/i, '');

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
}
