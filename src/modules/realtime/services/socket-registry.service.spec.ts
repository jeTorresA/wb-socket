import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocketRegistryService } from './socket-registry.service';
import { UserConected } from '../../../entities/UserConected.entity';

describe('SocketRegistryService', () => {
  let service: SocketRegistryService;
  let repository: jest.Mocked<Repository<UserConected>>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocketRegistryService,
        {
          provide: getRepositoryToken(UserConected),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SocketRegistryService>(SocketRegistryService);
    repository = module.get(getRepositoryToken(UserConected));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerSocket', () => {
    it('should register a socket with namespace and join user room', async () => {
      const mockClient = {
        id: 'socket-123',
        join: jest.fn(),
        rooms: new Set(),
      } as any;

      const mockUserConected = {
        id: 'uuid-123',
        userId: 'user-1',
        userName: 'Test User',
        namespace: 'chat',
        client: { id: 'socket-123' },
      };

      mockRepository.create.mockReturnValue(mockUserConected as any);
      mockRepository.save.mockResolvedValue(mockUserConected as any);

      const result = await service.registerSocket(
        mockClient,
        'user-1',
        'Test User',
        'chat',
        { connected: true },
      );

      expect(mockClient.join).toHaveBeenCalledWith('user:user-1');
      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 'user-1',
        userName: 'Test User',
        namespace: 'chat',
        client: { id: 'socket-123', connected: true },
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUserConected);
    });

    it('should not join room if already joined', async () => {
      const mockClient = {
        id: 'socket-123',
        join: jest.fn(),
        rooms: new Set(['user:user-1']),
      } as any;

      const mockUserConected = {
        id: 'uuid-123',
        userId: 'user-1',
        userName: 'Test User',
        namespace: 'chat',
        client: { id: 'socket-123' },
      };

      mockRepository.create.mockReturnValue(mockUserConected as any);
      mockRepository.save.mockResolvedValue(mockUserConected as any);

      await service.registerSocket(mockClient, 'user-1', 'Test User', 'chat');

      expect(mockClient.join).not.toHaveBeenCalled();
    });
  });

  describe('removeSocket', () => {
    const buildDeleteQueryBuilder = (affected: number) => {
      const mockQueryBuilder = {
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected }),
      };
      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      return mockQueryBuilder;
    };

    it('should remove socket by JSON client id and return true when found', async () => {
      const queryBuilder = buildDeleteQueryBuilder(1);

      const result = await service.removeSocket('socket-123');

      expect(result).toBe(true);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        "JSON_EXTRACT(client, '$.id') = :socketId",
        { socketId: 'socket-123' },
      );
      expect(queryBuilder.execute).toHaveBeenCalled();
    });

    it('should return false when socket not found', async () => {
      buildDeleteQueryBuilder(0);

      const result = await service.removeSocket('socket-999');

      expect(result).toBe(false);
    });
  });

  describe('getUserSockets', () => {
    it('should return user sockets for specific namespace', async () => {
      const mockSockets = [
        { id: '1', userId: 'user-1', namespace: 'chat', client: { id: 'socket-1' } },
        { id: '2', userId: 'user-1', namespace: 'chat', client: { id: 'socket-2' } },
      ];

      mockRepository.find.mockResolvedValue(mockSockets as any);

      const result = await service.getUserSockets('user-1', 'chat');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user-1', namespace: 'chat' },
      });
      expect(result).toEqual(mockSockets);
    });
  });

  describe('getUsersSockets', () => {
    it('should return sockets for multiple users in namespace', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.getUsersSockets(['user-1', 'user-2'], 'chat');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'uc.userId IN (:...userIds)',
        { userIds: ['user-1', 'user-2'] },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'uc.namespace = :namespace',
        { namespace: 'chat' },
      );
    });

    it('should return empty array when no userIds provided', async () => {
      const result = await service.getUsersSockets([], 'chat');

      expect(result).toEqual([]);
      expect(mockRepository.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('isSocketRegistered', () => {
    it('should return true when socket is registered', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.isSocketRegistered('socket-123');

      expect(result).toBe(true);
    });

    it('should return false when socket is not registered', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.isSocketRegistered('socket-999');

      expect(result).toBe(false);
    });
  });
});
