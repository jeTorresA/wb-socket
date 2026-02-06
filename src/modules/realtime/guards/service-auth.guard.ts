import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guard para autenticación servicio-a-servicio
 * Valida token Bearer en header Authorization
 */
@Injectable()
export class ServiceAuthGuard implements CanActivate {
  private readonly serviceToken: string;

  constructor(private configService: ConfigService) {
    this.serviceToken = this.configService.get<string>('SERVICE_AUTH_TOKEN');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('Token de autorización requerido');
    }

    const [bearer, token] = authHeader.split(' ');

    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Formato de token inválido. Use: Bearer TOKEN');
    }

    if (!this.serviceToken) {
      throw new UnauthorizedException('Servicio no configurado correctamente');
    }

    if (token !== this.serviceToken) {
      throw new UnauthorizedException('Token de servicio inválido');
    }

    return true;
  }
}
