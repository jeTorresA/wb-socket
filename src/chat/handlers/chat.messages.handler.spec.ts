import { ChatMessagesHandler } from './chat.messages.handler';
import { ChatRoomsHandler } from './chat.rooms.handler';

describe('Identidad del chat derivada del token', () => {
  const identity = { issuer: 'repotencia', userId: 'ana', userName: 'ana' };
  const issuerJwtService: any = { qualifyUserId: (iss: string, id: string) => `${iss}:${id}` };

  let chatService: any;
  let emitted: { room: string; event: string; payload: any }[];
  let server: any;

  beforeEach(() => {
    emitted = [];
    server = { to: (room: string) => ({ emit: (event: string, payload: any) => emitted.push({ room, event, payload }) }) };
    chatService = {
      getRoomSubscribers: jest.fn().mockResolvedValue([{ id_user: 'ana' }, { id_user: 'juan' }]),
      createMensaje: jest.fn().mockImplementation(async (m: any) => ({ id: 1, ...m })),
      updateMessagesToRead: jest.fn(),
      updateMessagesAsRead: jest.fn(),
      obtenerSalasSuscritas: jest.fn().mockResolvedValue([]),
    };
  });

  describe('ChatMessagesHandler', () => {
    let handler: ChatMessagesHandler;
    beforeEach(() => { handler = new ChatMessagesHandler(chatService, issuerJwtService); });

    it('usa el emisor del token aunque el payload suplante a otro usuario', async () => {
      await handler.handleSendMessage(server, { id_sala: 's1', message: 'hola', id_user: 'juan', userName: 'x', fecha_creacion: new Date() }, identity);

      expect(chatService.createMensaje).toHaveBeenCalledWith(expect.objectContaining({ id_user: 'ana' }));
      expect(chatService.updateMessagesToRead).toHaveBeenCalledWith('s1', 'ana');
      expect(emitted).toEqual([
        expect.objectContaining({ room: 'user:repotencia:ana', event: 'sentMessage' }),
        expect.objectContaining({ room: 'user:repotencia:juan', event: 'newMessage' }),
      ]);
    });

    it('rechaza el mensaje si el emisor no pertenece a la sala', async () => {
      chatService.getRoomSubscribers.mockResolvedValue([{ id_user: 'juan' }, { id_user: 'pedro' }]);

      const result = await handler.handleSendMessage(server, { id_sala: 's1', message: 'hola', id_user: 'juan', userName: 'x', fecha_creacion: new Date() }, identity);

      expect(result).toBeUndefined();
      expect(chatService.createMensaje).not.toHaveBeenCalled();
      expect(emitted).toEqual([]);
    });

    it('rechaza el mensaje de un socket sin identidad', async () => {
      await handler.handleSendMessage(server, { id_sala: 's1', message: 'hola', id_user: 'ana', userName: 'x', fecha_creacion: new Date() }, undefined);

      expect(chatService.createMensaje).not.toHaveBeenCalled();
      expect(emitted).toEqual([]);
    });

    it('marca como leído solo para el lector del token y solo le notifica a él', async () => {
      await handler.handleSetMessagesAsRead(server, { id_sala: 's1', id_user: 'juan' }, identity);

      expect(chatService.updateMessagesAsRead).toHaveBeenCalledWith('s1', 'ana');
      expect(emitted).toEqual([{ room: 'user:repotencia:ana', event: 'messagesRead', payload: { id_sala: 's1', id_user: 'ana' } }]);
    });

    it('ignora la lectura de un socket sin identidad', async () => {
      await handler.handleSetMessagesAsRead(server, { id_sala: 's1', id_user: 'juan' }, undefined);

      expect(chatService.updateMessagesAsRead).not.toHaveBeenCalled();
      expect(emitted).toEqual([]);
    });
  });

  describe('ChatRoomsHandler.handleJoinRoom', () => {
    it('consulta las salas del usuario del token, no las del payload', async () => {
      const handler = new ChatRoomsHandler(chatService, {} as any, issuerJwtService);
      const client: any = { data: { identity }, join: jest.fn(), emit: jest.fn() };

      await handler.handleJoinRoom(client, { id_user: 'juan', salasActuales: [] });

      expect(chatService.obtenerSalasSuscritas).toHaveBeenCalledWith('ana', []);
    });

    it('no consulta nada para un socket sin identidad', async () => {
      const handler = new ChatRoomsHandler(chatService, {} as any, issuerJwtService);
      const client: any = { data: {}, join: jest.fn(), emit: jest.fn() };

      await handler.handleJoinRoom(client, { id_user: 'juan', salasActuales: [] });

      expect(chatService.obtenerSalasSuscritas).not.toHaveBeenCalled();
    });
  });
});
