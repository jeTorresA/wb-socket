import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException, UseGuards } from '@nestjs/common';
import { EventDispatcherService } from '../services/event-dispatcher.service';
import { PublishEventDto } from '../dto/publish-event.dto';
import { ServiceAuthGuard } from '../guards/service-auth.guard';

/**
 * Controlador para publicar eventos realtime vía HTTP
 * Permite que backends externos emitan eventos sin usar Socket.IO
 * Protegido con autenticación servicio-a-servicio
 */
@Controller('events')
@UseGuards(ServiceAuthGuard)
export class EventsController {
  private readonly allowedNamespaces = ['chat', 'notifications', 'example'];

  constructor(private readonly eventDispatcher: EventDispatcherService) {}

  /**
   * Publica un evento realtime
   * POST /events/publish
   */
  @Post('publish')
  @HttpCode(HttpStatus.OK)
  async publishEvent(@Body() dto: PublishEventDto): Promise<{ success: boolean; message: string }> {
    // Validar namespace permitido
    if (!this.allowedNamespaces.includes(dto.namespace)) {
      throw new BadRequestException(
        `Namespace '${dto.namespace}' no permitido. Namespaces válidos: ${this.allowedNamespaces.join(', ')}`
      );
    }

    // Validar que al menos rooms o users estén presentes
    if ((!dto.rooms || dto.rooms.length === 0) && (!dto.users || dto.users.length === 0)) {
      throw new BadRequestException('Debe especificar al menos un room o usuario');
    }

    // Publicar evento
    this.eventDispatcher.publish(dto);

    return {
      success: true,
      message: `Evento '${dto.event}' publicado en namespace '${dto.namespace}'`,
    };
  }
}
