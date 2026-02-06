import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ServiceAuthGuard } from './service-auth.guard';

describe('ServiceAuthGuard', () => {
  let guard: ServiceAuthGuard;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceAuthGuard,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    guard = module.get<ServiceAuthGuard>(ServiceAuthGuard);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  const createMockContext = (authHeader?: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: authHeader ? { authorization: authHeader } : {},
        }),
      }),
    } as ExecutionContext;
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access with valid token', () => {
    mockConfigService.get.mockReturnValue('valid-token-123');
    const guardInstance = new ServiceAuthGuard(configService);
    const context = createMockContext('Bearer valid-token-123');

    expect(guardInstance.canActivate(context)).toBe(true);
  });

  it('should throw error when no authorization header', () => {
    mockConfigService.get.mockReturnValue('valid-token-123');
    const context = createMockContext();

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Token de autorización requerido');
  });

  it('should throw error when invalid format (no Bearer)', () => {
    mockConfigService.get.mockReturnValue('valid-token-123');
    const context = createMockContext('valid-token-123');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(context)).toThrow('Formato de token inválido');
  });

  it('should throw error when invalid format (Bearer only)', () => {
    mockConfigService.get.mockReturnValue('valid-token-123');
    const context = createMockContext('Bearer ');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should throw error when service not configured', () => {
    mockConfigService.get.mockReturnValue(undefined);
    const guardInstance = new ServiceAuthGuard(configService);
    const context = createMockContext('Bearer some-token');

    expect(() => guardInstance.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guardInstance.canActivate(context)).toThrow('Servicio no configurado correctamente');
  });

  it('should throw error when token is invalid', () => {
    mockConfigService.get.mockReturnValue('valid-token-123');
    const guardInstance = new ServiceAuthGuard(configService);
    const context = createMockContext('Bearer invalid-token');

    expect(() => guardInstance.canActivate(context)).toThrow(UnauthorizedException);
    expect(() => guardInstance.canActivate(context)).toThrow('Token de servicio inválido');
  });
});
