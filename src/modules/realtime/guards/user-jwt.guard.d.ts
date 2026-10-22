import { CanActivate, ExecutionContext } from '@nestjs/common';
import { IssuerJwtService } from '../services/issuer-jwt.service';
export declare class UserJwtGuard implements CanActivate {
    private readonly issuerJwtService;
    constructor(issuerJwtService: IssuerJwtService);
    canActivate(context: ExecutionContext): boolean;
}
