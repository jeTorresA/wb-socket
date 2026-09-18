import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventDispatcherService } from './services/event-dispatcher.service';
import { SocketRegistryService } from './services/socket-registry.service';
import { SocketServerProvider } from './providers/socket-server.provider';
import { IssuerJwtService } from './services/issuer-jwt.service';
import { EventsController } from './controllers/events.controller';
import { UserConected } from '../../entities/UserConected.entity';

/**
 * Módulo realtime base para infraestructura multi-plataforma
 * Proporciona servicios reutilizables para distribución de eventos y gestión de sockets
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserConected])],
  controllers: [EventsController],
  providers: [
    SocketServerProvider,
    EventDispatcherService,
    SocketRegistryService,
    IssuerJwtService,
  ],
  exports: [
    SocketServerProvider,
    EventDispatcherService,
    SocketRegistryService,
    IssuerJwtService,
  ],
})
export class RealtimeModule {}
