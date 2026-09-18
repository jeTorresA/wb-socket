import { EventDispatcherService } from '../services/event-dispatcher.service';
import { PublishEventDto } from '../dto/publish-event.dto';
export declare class EventsController {
    private readonly eventDispatcher;
    private readonly allowedNamespaces;
    constructor(eventDispatcher: EventDispatcherService);
    publishEvent(dto: PublishEventDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
