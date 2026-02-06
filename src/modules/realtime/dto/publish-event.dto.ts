import { IsString, IsNotEmpty, IsArray, IsOptional, ValidateNested } from 'class-validator';

/**
 * DTO para publicar eventos realtime en namespaces específicos
 * Formato de eventos: recurso.accion (ej: message.created, notification.new)
 */
export class PublishEventDto {
  @IsString()
  @IsNotEmpty()
  namespace: string;

  @IsString()
  @IsNotEmpty()
  event: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  rooms?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  users?: string[];

  @IsNotEmpty()
  payload: any;
}
