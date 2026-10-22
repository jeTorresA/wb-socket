import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { RoomsController } from './rooms.controller';
import { ChatService } from 'src/chat/chat.service';
import { IssuerJwtService } from 'src/modules/realtime/services/issuer-jwt.service';
import { UserJwtGuard } from 'src/modules/realtime/guards/user-jwt.guard';

const identity = (userId: string, isAdmin = false) => ({ issuer: 'repotencia', userId, userName: userId, isAdmin });

/** Respuesta express simulada que guarda el status y el cuerpo */
const mockRes = () => {
  const res: any = {};
  res.status = jest.fn((code: number) => { res.statusCode = code; return res; });
  res.json = jest.fn((body: any) => { res.body = body; return res; });
  return res;
};

describe('IssuerJwtService: identidad y administrador', () => {
  const SECRET = 'secreto-de-prueba';
  let service: IssuerJwtService;

  beforeEach(() => {
    process.env.JWT_ISSUERS = JSON.stringify([{
      iss: 'repotencia', algo: 'HS256', secret: SECRET,
      idClaim: 'user.id_usuario', nameClaim: 'user.nombre_usuario',
      adminClaim: 'user.perfil.id_perfil_usuario', adminValues: [31],
    }]);
    service = new IssuerJwtService();
    service.onModuleInit();
  });

  const firmar = (perfil: number) => jwt.sign({ iss: 'repotencia', user: { id_usuario: '1', nombre_usuario: 'ana', perfil: { id_perfil_usuario: perfil } } }, SECRET);

  it('marca como administrador al perfil configurado', () => {
    expect(service.verify(firmar(31))).toMatchObject({ userId: '1', isAdmin: true });
  });

  it('no marca como administrador a otros perfiles', () => {
    expect(service.verify(firmar(5))).toMatchObject({ userId: '1', isAdmin: false });
  });

  it('rechaza un token firmado con otra clave', () => {
    const falso = jwt.sign({ iss: 'repotencia', user: { id_usuario: '1', perfil: { id_perfil_usuario: 31 } } }, 'otra-clave');
    expect(service.verify(falso)).toBeNull();
  });
});

describe('UserJwtGuard', () => {
  const contexto = (headers: any) => {
    const request: any = { headers };
    return { request, ctx: { switchToHttp: () => ({ getRequest: () => request }) } as any };
  };

  it('exige el header Authorization', () => {
    const guard = new UserJwtGuard({ verify: jest.fn() } as any);
    expect(() => guard.canActivate(contexto({}).ctx)).toThrow(UnauthorizedException);
  });

  it('rechaza un token inválido', () => {
    const guard = new UserJwtGuard({ verify: jest.fn().mockReturnValue(null) } as any);
    expect(() => guard.canActivate(contexto({ authorization: 'Bearer malo' }).ctx)).toThrow(UnauthorizedException);
  });

  it('deja la identidad del token en la petición', () => {
    const guard = new UserJwtGuard({ verify: jest.fn().mockReturnValue(identity('ana')) } as any);
    const { request, ctx } = contexto({ authorization: 'Bearer bueno' });

    expect(guard.canActivate(ctx)).toBe(true);
    expect(request.identity).toMatchObject({ userId: 'ana' });
  });
});

describe('ChatService.getRoomAccess', () => {
  const crear = (sala: any, miembros: string[]) => {
    const salasRepo: any = { findOne: jest.fn().mockResolvedValue(sala) };
    const suscriptoresRepo: any = { count: jest.fn(async ({ where }: any) => (miembros.includes(where.id_user) ? 1 : 0)) };
    return new ChatService({} as any, salasRepo, suscriptoresRepo, {} as any);
  };
  const grupo = { id_sala: 'g', tipo: 2, creador: 'creador' };

  it('un miembro común no administra un grupo', async () => {
    expect(await crear(grupo, ['creador', 'ana']).getRoomAccess('g', identity('ana'))).toMatchObject({ isMember: true, canManage: false });
  });

  it('el creador administra su grupo', async () => {
    expect((await crear(grupo, ['creador']).getRoomAccess('g', identity('creador'))).canManage).toBe(true);
  });

  it('un administrador miembro administra el grupo', async () => {
    expect((await crear(grupo, ['creador', 'admin']).getRoomAccess('g', identity('admin', true))).canManage).toBe(true);
  });

  it('un administrador que no es miembro no administra el grupo', async () => {
    expect(await crear(grupo, ['creador']).getRoomAccess('g', identity('admin', true))).toMatchObject({ isMember: false, canManage: false });
  });

  it('cualquier participante administra (elimina) un chat directo', async () => {
    expect((await crear({ id_sala: 'd', tipo: 1, creador: 'juan' }, ['juan', 'ana']).getRoomAccess('d', identity('ana'))).canManage).toBe(true);
  });

  it('una sala inexistente no da permisos', async () => {
    expect(await crear(null, []).getRoomAccess('x', identity('ana'))).toEqual({ sala: null, isMember: false, canManage: false });
  });
});

describe('RoomsController: autorización', () => {
  let chatService: any;
  let controller: RoomsController;
  const issuerJwtService: any = { qualifyUserId: (iss: string, id: string) => `${iss}:${id}` };
  const req = (id: string, isAdmin = false): any => ({ identity: identity(id, isAdmin) });

  beforeEach(() => {
    chatService = {
      getRoomAccess: jest.fn(),
      getRoomSubscribers: jest.fn().mockResolvedValue([{ id_user: 'ana' }]),
      sanitizeSubscribers: (s: any[]) => (s || []).map(x => ({ id_user: String(x.id_user) })),
      validarSala: jest.fn().mockResolvedValue([]),
      updateSubscribers: jest.fn().mockResolvedValue({ suscriptoresAgregados: [], suscriptoresEliminados: [] }),
      updateRoom: jest.fn().mockResolvedValue({ tipo: 2 }),
      getActiveSubscribers: jest.fn().mockResolvedValue([]),
      deleteRoom: jest.fn().mockResolvedValue({ suscriptores: [] }),
    };
    controller = new RoomsController({ verifyConnectedClients: jest.fn(), emitToUser: jest.fn() } as any, chatService, issuerJwtService);
  });

  it('GET subscribers: rechaza a quien no es miembro', async () => {
    chatService.getRoomAccess.mockResolvedValue({ sala: { tipo: 2 }, isMember: false, canManage: false });
    const res = mockRes();
    await controller.handleGetSalas('g', req('intruso'), res);
    expect(res.statusCode).toBe(403);
    expect(chatService.getRoomSubscribers).not.toHaveBeenCalled();
  });

  it('PUT: solo se editan grupos', async () => {
    chatService.getRoomAccess.mockResolvedValue({ sala: { tipo: 1 }, isMember: true, canManage: true });
    const res = mockRes();
    await controller.handlePutRoom('d', { nombre_sala: 'x', suscriptores: [{ id_user: 'ana' }] } as any, req('ana'), res);
    expect(res.statusCode).toBe(400);
    expect(chatService.updateSubscribers).not.toHaveBeenCalled();
  });

  it('PUT: a quien no participa le responde 403 sin revelar el tipo de sala', async () => {
    chatService.getRoomAccess.mockResolvedValue({ sala: { tipo: 1 }, isMember: false, canManage: false });
    const res = mockRes();
    await controller.handlePutRoom('d', { nombre_sala: 'x', suscriptores: [{ id_user: 'ana' }] } as any, req('ana'), res);
    expect(res.statusCode).toBe(403);
  });

  it('PUT: rechaza a un miembro sin permisos de administración', async () => {
    chatService.getRoomAccess.mockResolvedValue({ sala: { tipo: 2 }, isMember: true, canManage: false });
    const res = mockRes();
    await controller.handlePutRoom('g', { nombre_sala: 'x', suscriptores: [{ id_user: 'ana' }] } as any, req('ana'), res);
    expect(res.statusCode).toBe(403);
    expect(chatService.updateSubscribers).not.toHaveBeenCalled();
  });

  it('PUT: quien edita debe seguir en el grupo', async () => {
    chatService.getRoomAccess.mockResolvedValue({ sala: { tipo: 2 }, isMember: true, canManage: true });
    const res = mockRes();
    await controller.handlePutRoom('g', { nombre_sala: 'x', suscriptores: [{ id_user: 'otro' }] } as any, req('ana'), res);
    expect(res.statusCode).toBe(400);
  });

  it('PUT: aplica los cambios con suscriptores saneados y sin tocar creador ni tipo', async () => {
    const sala = { id_sala: 'g', tipo: 2, creador: 'ana', nombre_sala: 'viejo' };
    chatService.getRoomAccess.mockResolvedValue({ sala, isMember: true, canManage: true });
    const res = mockRes();
    await controller.handlePutRoom('g', { nombre_sala: ' nuevo ', creador: 'pedro', tipo: 1, suscriptores: [{ id_user: 'ana' }, { id_user: 'juan' }] } as any, req('ana'), res);
    expect(res.statusCode).toBe(200);
    expect(chatService.updateRoom).toHaveBeenCalledWith('g', expect.objectContaining({ nombre_sala: 'nuevo', creador: 'ana', tipo: 2 }));
  });

  it('DELETE: rechaza a quien no puede administrar la sala', async () => {
    chatService.getRoomAccess.mockResolvedValue({ sala: { tipo: 2 }, isMember: true, canManage: false });
    const res = mockRes();
    await controller.handleDeleteRoom('g', req('ana'), res);
    expect(res.statusCode).toBe(403);
    expect(chatService.deleteRoom).not.toHaveBeenCalled();
  });

  it('DELETE: un participante elimina su chat directo', async () => {
    chatService.getRoomAccess.mockResolvedValue({ sala: { tipo: 1 }, isMember: true, canManage: true });
    const res = mockRes();
    await controller.handleDeleteRoom('d', req('ana'), res);
    expect(res.statusCode).toBe(200);
    expect(chatService.deleteRoom).toHaveBeenCalledWith('d');
  });
});
