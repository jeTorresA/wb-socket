import { Test, TestingModule } from '@nestjs/testing';
import { EventDispatcherService } from './event-dispatcher.service';
import { SocketServerProvider } from '../providers/socket-server.provider';
import { Server } from 'socket.io';

describe('EventDispatcherService', () => {
  let service: EventDispatcherService;
  let socketServerProvider: SocketServerProvider;
  let mockServer: jest.Mocked<Server>;
  let mockNamespace: any;

  beforeEach(async () => {
    mockNamespace = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: new Map(),
    };

    mockServer = {
      of: jest.fn().mockReturnValue(mockNamespace),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [EventDispatcherService, SocketServerProvider],
    }).compile();

    service = module.get<EventDispatcherService>(EventDispatcherService);
    socketServerProvider = module.get<SocketServerProvider>(SocketServerProvider);
    socketServerProvider.setServer(mockServer);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNamespace', () => {
    it('should return namespace with correct path', () => {
      service.getNamespace('chat');
      expect(mockServer.of).toHaveBeenCalledWith('/chat');
    });
  });

  describe('emitToRooms', () => {
    it('should emit event to multiple rooms', () => {
      const rooms = ['room:123', 'room:456'];
      const event = 'message.created';
      const payload = { text: 'test' };

      service.emitToRooms('chat', rooms, event, payload);

      expect(mockServer.of).toHaveBeenCalledWith('/chat');
      expect(mockNamespace.to).toHaveBeenCalledTimes(2);
      expect(mockNamespace.emit).toHaveBeenCalledTimes(2);
      expect(mockNamespace.emit).toHaveBeenCalledWith(event, payload);
    });
  });

  describe('emitToUsers', () => {
    it('should emit event to multiple users', () => {
      const users = ['user:1', 'user:2'];
      const event = 'notification.new';
      const payload = { message: 'test' };

      service.emitToUsers('chat', users, event, payload);

      expect(mockServer.of).toHaveBeenCalledWith('/chat');
      expect(mockNamespace.to).toHaveBeenCalledTimes(2);
      expect(mockNamespace.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('publish', () => {
    it('should publish to rooms when rooms are provided', () => {
      const dto = {
        namespace: 'chat',
        event: 'message.created',
        rooms: ['room:123'],
        payload: { text: 'test' },
      };

      service.publish(dto);

      expect(mockServer.of).toHaveBeenCalledWith('/chat');
      expect(mockNamespace.emit).toHaveBeenCalledWith(dto.event, dto.payload);
    });

    it('should publish to users when users are provided', () => {
      const dto = {
        namespace: 'chat',
        event: 'notification.new',
        users: ['user:1'],
        payload: { message: 'test' },
      };

      service.publish(dto);

      expect(mockServer.of).toHaveBeenCalledWith('/chat');
      expect(mockNamespace.emit).toHaveBeenCalledWith(dto.event, dto.payload);
    });

    it('should publish to both rooms and users', () => {
      const dto = {
        namespace: 'chat',
        event: 'message.created',
        rooms: ['room:123'],
        users: ['user:1'],
        payload: { text: 'test' },
      };

      service.publish(dto);

      expect(mockNamespace.to).toHaveBeenCalledTimes(2);
      expect(mockNamespace.emit).toHaveBeenCalledTimes(2);
    });
  });
});
