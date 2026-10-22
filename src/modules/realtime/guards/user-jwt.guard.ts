import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { IssuerJwtService } from '../services/issuer-jwt.service';

/**
 * Guard para endpoints HTTP consumidos por usuarios finales.
 * Valida el JWT de la plataforma emisora (header Authorization: Bearer TOKEN) con los mismos
 * emisores del handshake de sockets y deja la identidad en `request.identity`.
 */
@Injectable()
export class UserJwtGuard implements CanActivate {
  constructor(private readonly issuerJwtService: IssuerJwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Token de autorización requerido');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Formato de token inválido. Use: Bearer TOKEN');
    }

    const identity = this.issuerJwtService.verify(token);
    if (!identity) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    request.identity = identity;
    return true;
  }
}
