import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatMessagesHandler } from './handlers/chat.messages.handler';
import { ChatRoomsHandler } from './handlers/chat.rooms.handler';
import { ChatFilesHandler } from './handlers/chat.files.handler';
import { RealtimeModule } from 'src/modules/realtime';
import { MensajesChat } from 'src/entities/MensajesChat.entity';
import { SuscriptoresSalasChat } from 'src/entities/SuscriptoresSalasChat.entity';
import { SalasChat } from 'src/entities/SalasChat.entity';
import { ArchivosChat } from 'src/entities/ArchivosChat.entity';
import { UserConected } from 'src/entities/UserConected.entity';

@Module({
  imports: [
    RealtimeModule,
    TypeOrmModule.forFeature([
      MensajesChat,
      SuscriptoresSalasChat,
      SalasChat,
      ArchivosChat,
      UserConected,
    ]),
  ],
  providers: [
    ChatService,
    ChatGateway,
    ChatMessagesHandler,
    ChatRoomsHandler,
    ChatFilesHandler,
  ],
  exports: [ChatGateway, ChatService],
})
export class ChatModule {}
