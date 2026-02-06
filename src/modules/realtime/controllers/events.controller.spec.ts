import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventsController } from './events.controller';
import { EventDispatcherService } from '../services/event-dispatcher.service';
import { PublishEventDto } from '../dto/publish-event.dto';

describe('EventsController', () => {
  let controller: EventsController;
  let eventDispatcher: jest.Mocked<EventDispatcherService>;

  const mockEventDispatcher = {
    publish: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventDispatcherService,
          useValue: mockEventDispatcher,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    eventDispatcher = module.get(EventDispatcherService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('publishEvent', () => {
    it('should publish event to rooms', async () => {
      const dto: PublishEventDto = {
        namespace: 'chat',
        event: 'message.created',
        rooms: ['room:123'],
        payload: { text: 'test' },
      };

      const result = await controller.publishEvent(dto);

      expect(eventDispatcher.publish).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        success: true,
        message: "Evento 'message.created' publicado en namespace 'chat'",
      });
    });

    it('should publish event to users', async () => {
      const dto: PublishEventDto = {
        namespace: 'notifications',
        event: 'notification.new',
        users: ['user-1', 'user-2'],
        payload: { message: 'test' },
      };

      const result = await controller.publishEvent(dto);

      expect(eventDispatcher.publish).toHaveBeenCalledWith(dto);
      expect(result.success).toBe(true);
    });

    it('should publish event to both rooms and users', async () => {
      const dto: PublishEventDto = {
        namespace: 'chat',
        event: 'message.broadcast',
        rooms: ['room:123'],
        users: ['user-1'],
        payload: { text: 'test' },
      };

      await controller.publishEvent(dto);

      expect(eventDispatcher.publish).toHaveBeenCalledWith(dto);
    });

    it('should throw error for invalid namespace', async () => {
      const dto: PublishEventDto = {
        namespace: 'invalid',
        event: 'test.event',
        users: ['user-1'],
        payload: {},
      };

      await expect(controller.publishEvent(dto)).rejects.toThrow(BadRequestException);
      await expect(controller.publishEvent(dto)).rejects.toThrow(
        "Namespace 'invalid' no permitido"
      );
    });

    it('should throw error when no rooms or users specified', async () => {
      const dto: PublishEventDto = {
        namespace: 'chat',
        event: 'test.event',
        rooms: [],
        users: [],
        payload: {},
      };

      await expect(controller.publishEvent(dto)).rejects.toThrow(BadRequestException);
      await expect(controller.publishEvent(dto)).rejects.toThrow(
        'Debe especificar al menos un room o usuario'
      );
    });

    it('should accept event when only rooms are specified', async () => {
      const dto: PublishEventDto = {
        namespace: 'chat',
        event: 'message.created',
        rooms: ['room:123'],
        payload: { text: 'test' },
      };

      const result = await controller.publishEvent(dto);

      expect(result.success).toBe(true);
    });

    it('should accept event when only users are specified', async () => {
      const dto: PublishEventDto = {
        namespace: 'chat',
        event: 'message.created',
        users: ['user-1'],
        payload: { text: 'test' },
      };

      const result = await controller.publishEvent(dto);

      expect(result.success).toBe(true);
    });
  });
});
