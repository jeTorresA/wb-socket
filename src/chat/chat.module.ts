import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MensajesChat } from 'src/entities/MensajesChat.entity';
import { SuscriptoresSalasChat } from 'src/entities/SuscriptoresSalasChat.entity';
import { SalasChat } from 'src/entities/SalasChat.entity';
import { ArchivosChat } from 'src/entities/ArchivosChat.entity';
import { UserConected } from 'src/entities/UserConected.entity';

@Module({
  providers: [ChatService, ChatGateway],
  imports: [TypeOrmModule.forFeature([MensajesChat, SuscriptoresSalasChat, SalasChat, ArchivosChat, UserConected])],
  exports: [ChatGateway, ChatService]
})
export class ChatModule {}
