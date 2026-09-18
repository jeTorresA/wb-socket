import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class ServiceAuthGuard implements CanActivate {
    private configService;
    private readonly serviceToken;
    constructor(configService: ConfigService);
    canActivate(context: ExecutionContext): boolean;
}
