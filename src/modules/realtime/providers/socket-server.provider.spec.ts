import { Test, TestingModule } from '@nestjs/testing';
import { SocketServerProvider } from './socket-server.provider';
import { Server } from 'socket.io';

describe('SocketServerProvider', () => {
  let provider: SocketServerProvider;
  let mockServer: jest.Mocked<Server>;
  let mockNamespace: any;

  beforeEach(async () => {
    mockNamespace = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

    mockServer = {
      of: jest.fn().mockReturnValue(mockNamespace),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [SocketServerProvider],
    }).compile();

    provider = module.get<SocketServerProvider>(SocketServerProvider);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('setServer and getServer', () => {
    it('should set and get server instance', () => {
      provider.setServer(mockServer);
      expect(provider.getServer()).toBe(mockServer);
    });

    it('should throw error when getting server before initialization', () => {
      expect(() => provider.getServer()).toThrow('Socket.IO server no ha sido inicializado');
    });
  });

  describe('isInitialized', () => {
    it('should return false when not initialized', () => {
      expect(provider.isInitialized()).toBe(false);
    });

    it('should return true when initialized', () => {
      provider.setServer(mockServer);
      expect(provider.isInitialized()).toBe(true);
    });
  });

  describe('getNamespace', () => {
    it('should get namespace from server', () => {
      provider.setServer(mockServer);
      const ns = provider.getNamespace('chat');

      expect(mockServer.of).toHaveBeenCalledWith('/chat');
      expect(ns).toBe(mockNamespace);
    });
  });

  describe('emitToNamespace', () => {
    it('should emit to namespace', () => {
      provider.setServer(mockServer);
      provider.emitToNamespace('chat', 'test.event', { data: 'test' });

      expect(mockServer.of).toHaveBeenCalledWith('/chat');
      expect(mockNamespace.emit).toHaveBeenCalledWith('test.event', { data: 'test' });
    });
  });

  describe('emitToRooms', () => {
    it('should emit to multiple rooms', () => {
      provider.setServer(mockServer);
      provider.emitToRooms('chat', ['room:1', 'room:2'], 'test.event', { data: 'test' });

      expect(mockServer.of).toHaveBeenCalledWith('/chat');
      expect(mockNamespace.to).toHaveBeenCalledTimes(2);
      expect(mockNamespace.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('emitToUsers', () => {
    it('should emit to multiple users with user: prefix', () => {
      provider.setServer(mockServer);
      provider.emitToUsers('chat', ['user-1', 'user-2'], 'test.event', { data: 'test' });

      expect(mockServer.of).toHaveBeenCalledWith('/chat');
      expect(mockNamespace.to).toHaveBeenCalledWith('user:user-1');
      expect(mockNamespace.to).toHaveBeenCalledWith('user:user-2');
      expect(mockNamespace.emit).toHaveBeenCalledTimes(2);
    });
  });
});
