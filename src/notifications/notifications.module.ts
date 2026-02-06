import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { RealtimeModule } from 'src/modules/realtime';

@Module({
  imports: [RealtimeModule],
  providers: [NotificationsGateway],
  exports: [NotificationsGateway],
})
export class NotificationsModule {}
