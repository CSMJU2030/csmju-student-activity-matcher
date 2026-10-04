import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ChatsController],
  providers: [ChatsService],
})
export class ChatsModule {}
