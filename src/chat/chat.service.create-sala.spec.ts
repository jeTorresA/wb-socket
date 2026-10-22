import { ChatService } from './chat.service';
import { ChatMessagesHandler } from './handlers/chat.messages.handler';
import { ChatRoomsHandler } from './handlers/chat.rooms.handler';

describe('ChatService.createSala (creador derivado del token)', () => {
  let salasRepo: any;
  let suscriptoresRepo: any;
  let service: ChatService;

  const susc = (id_user: string, extra: any = {}) => ({ id_user, id_sala: '', nombre_sala: `Chat ${id_user}`, imagen_sala: `${id_user}.webp`, fecha_suscripcion: new Date(), ...extra });

  beforeEach(() => {
    salasRepo = {
      createQueryBuilder: () => ({ where: () => ({ getMany: async () => salasRepo.__existentes }) }),
      __existentes: [],
      create: jest.fn((d: any) => d),
      save: jest.fn(async (d: any) => ({ id_sala: 'nueva', tipo: d.tipo ?? 1, ...d })),
    };
    suscriptoresRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn((d: any) => d),
      save: jest.fn(async (d: any) => d),
      count: jest.fn().mockResolvedValue(0),
      createQueryBuilder: jest.fn(),
    };
    service = new ChatService({} as any, salasRepo, suscriptoresRepo, {} as any);
  });

  it('crea la sala con el creador del token e ignora id_sala/creador del payload', async () => {
    const result = await service.createSala(
      { id_sala: 'forzada', nombre_sala: 'ana_juan', creador: 'pedro', fecha_creacion: new Date(), suscriptores: [susc('ana'), susc('juan')] } as any,
      'ana',
    );

    expect(result.type).toBe('response');
    expect(salasRepo.save).toHaveBeenCalledWith({ nombre_sala: 'ana_juan', creador: 'ana', tipo: 1 });
    const guardados = suscriptoresRepo.save.mock.calls[0][0];
    expect(guardados.map((s: any) => s.id_user)).toEqual(['ana', 'juan']);
    expect(guardados.every((s: any) => s.id_sala === 'nueva' && s.mensajes_por_leer === 0)).toBe(true);
  });

  it('rechaza si el creador no está entre los suscriptores', async () => {
    const result = await service.createSala({ nombre_sala: 'juan_pedro', suscriptores: [susc('juan'), susc('pedro')] } as any, 'ana');

    expect(result.type).toBe('warning');
    expect(salasRepo.save).not.toHaveBeenCalled();
  });

  it('rechaza un chat directo con más de dos participantes', async () => {
    const result = await service.createSala({ nombre_sala: 'ana_juan', suscriptores: [susc('ana'), susc('juan'), susc('pedro')] } as any, 'ana');

    expect(result.type).toBe('warning');
    expect(salasRepo.save).not.toHaveBeenCalled();
  });

  it('solo un administrador puede crear grupos', async () => {
    const grupo = { nombre_sala: 'Equipo', tipo: 2, suscriptores: [susc('ana'), susc('juan'), susc('pedro')] } as any;

    expect((await service.createSala(grupo, 'ana')).type).toBe('warning');
    expect(salasRepo.save).not.toHaveBeenCalled();

    expect((await service.createSala(grupo, 'ana', true)).type).toBe('response');
    expect(salasRepo.save).toHaveBeenCalledWith({ nombre_sala: 'Equipo', creador: 'ana', tipo: 2 });
  });

  it('elimina suscriptores repetidos', async () => {
    await service.createSala({ nombre_sala: 'ana_juan', suscriptores: [susc('ana'), susc('juan'), susc('juan')] } as any, 'ana');

    expect(suscriptoresRepo.save.mock.calls[0][0]).toHaveLength(2);
  });

  it('no permite reutilizar un chat directo ajeno conociendo su nombre', async () => {
    salasRepo.__existentes = [{ id_sala: 'privada', nombre_sala: 'juan_pedro', tipo: 1 }];
    suscriptoresRepo.find.mockResolvedValue([{ id_user: 'juan' }, { id_user: 'pedro' }]);

    const result = await service.createSala({ nombre_sala: 'juan_pedro', suscriptores: [susc('ana'), susc('juan')] } as any, 'ana');

    expect(result.type).toBe('warning');
    expect(suscriptoresRepo.save).not.toHaveBeenCalled();
    expect(suscriptoresRepo.findOne).not.toHaveBeenCalled();
  });

  it('al reutilizar un chat propio solo restaura a sus participantes (no agrega terceros)', async () => {
    salasRepo.__existentes = [{ id_sala: 'propia', nombre_sala: 'ana_juan', tipo: 1 }];
    suscriptoresRepo.find.mockResolvedValue([{ id_user: 'ana' }, { id_user: 'juan' }]);
    suscriptoresRepo.findOne.mockImplementation(async ({ where }: any) => ({ id_user: where.id_user, id_sala: where.id_sala, fecha_eliminacion: null }));

    const result = await service.createSala({ nombre_sala: 'ana_juan', suscriptores: [susc('ana'), susc('pedro')] } as any, 'ana');

    expect(result.type).toBe('response');
    expect(result.data.subscribers.map((s: any) => s.id_user)).toEqual(['ana']);
    expect(suscriptoresRepo.save).not.toHaveBeenCalled();
  });
});

describe('Handlers: historial y creación de salas', () => {
  const identity = { issuer: 'repotencia', userId: 'ana', userName: 'ana' };
  const issuerJwtService: any = { qualifyUserId: (iss: string, id: string) => `${iss}:${id}` };

  it('no entrega el historial de una sala a quien no pertenece a ella', async () => {
    const chatService: any = { isActiveSubscriber: jest.fn().mockResolvedValue(false), obtenerMensajesSala: jest.fn() };
    const handler = new ChatMessagesHandler(chatService, issuerJwtService);
    const client: any = { data: { identity }, emit: jest.fn() };

    await handler.handleJoinMessages(client, 'ajena');

    expect(chatService.isActiveSubscriber).toHaveBeenCalledWith('ajena', 'ana');
    expect(chatService.obtenerMensajesSala).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith('mensajesSala', []);
  });

  it('entrega el historial a un suscriptor activo', async () => {
    const chatService: any = { isActiveSubscriber: jest.fn().mockResolvedValue(true), obtenerMensajesSala: jest.fn().mockResolvedValue([{ id: 1 }]) };
    const handler = new ChatMessagesHandler(chatService, issuerJwtService);
    const client: any = { data: { identity }, emit: jest.fn() };

    await handler.handleJoinMessages(client, 'propia');

    expect(client.emit).toHaveBeenCalledWith('mensajesSala', [{ id: 1 }]);
  });

  it('crea la sala con el usuario del token como creador', async () => {
    const chatService: any = { createSala: jest.fn().mockResolvedValue({ type: 'warning', message: 'x' }) };
    const handler = new ChatRoomsHandler(chatService, {} as any, issuerJwtService);
    const client: any = { emit: jest.fn() };

    await handler.handleCreateRoom({} as any, client, { nombre_sala: 'a_b', creador: 'pedro', suscriptores: [] } as any, identity);

    expect(chatService.createSala).toHaveBeenCalledWith(expect.anything(), 'ana', false);
  });

  it('rechaza crear salas desde un socket sin identidad', async () => {
    const chatService: any = { createSala: jest.fn() };
    const handler = new ChatRoomsHandler(chatService, {} as any, issuerJwtService);
    const client: any = { emit: jest.fn() };

    await handler.handleCreateRoom({} as any, client, { nombre_sala: 'a_b', suscriptores: [] } as any, undefined);

    expect(chatService.createSala).not.toHaveBeenCalled();
    expect(client.emit).toHaveBeenCalledWith('advertencia', expect.any(String));
  });
});
