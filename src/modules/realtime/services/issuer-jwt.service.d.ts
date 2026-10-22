import { OnModuleInit } from '@nestjs/common';
import { Socket } from 'socket.io';
export interface IssuerConfig {
    iss: string;
    algo: string;
    publicKey?: string;
    secret?: string;
    idClaim: string;
    nameClaim: string;
    adminClaim?: string;
    adminValues?: (string | number)[];
}
export interface TokenIdentity {
    issuer: string;
    userId: string;
    userName: string;
    isAdmin?: boolean;
}
export declare class IssuerJwtService implements OnModuleInit {
    private issuers;
    onModuleInit(): void;
    verify(token: string): TokenIdentity | null;
    qualify(identity: TokenIdentity): {
        userId: string;
        userName: string;
    };
    qualifyUserId(issuer: string, userId: string): string;
    middleware(): (client: Socket, next: (err?: Error) => void) => void;
}
