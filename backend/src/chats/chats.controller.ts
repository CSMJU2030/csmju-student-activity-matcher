import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CurrentStudentService } from '../students/current-student.service';
import { ChatsService } from './chats.service';
import { MessagesQueryDto, OpenChatDto, SendMessageDto } from './dto/chat.dto';

/** 1:1 student chat. Only the two participants can read or post. */
@Controller('v1/chats')
@RequirePermissions(Permission.CHAT_USE)
export class ChatsController {
  constructor(
    private readonly chats: ChatsService,
    private readonly currentStudent: CurrentStudentService,
  ) {}

  @Get()
  async list(@CurrentUser() user: CoreHubIdentity) {
    const me = await this.currentStudent.require(user);
    return this.chats.list(me.id);
  }

  @Get('unread-count')
  async unread(@CurrentUser() user: CoreHubIdentity) {
    const me = await this.currentStudent.require(user);
    return this.chats.unreadTotal(me.id);
  }

  /** Start (or reopen) a chat with another student. */
  @Post()
  async open(@CurrentUser() user: CoreHubIdentity, @Body() body: OpenChatDto) {
    const me = await this.currentStudent.require(user);
    return this.chats.open(me.id, body.studentId);
  }

  @Get(':id/messages')
  async messages(@CurrentUser() user: CoreHubIdentity, @Param('id') id: string, @Query() query: MessagesQueryDto) {
    const me = await this.currentStudent.require(user);
    return this.chats.messages(me.id, id, query.after);
  }

  @Post(':id/messages')
  async send(@CurrentUser() user: CoreHubIdentity, @Param('id') id: string, @Body() body: SendMessageDto) {
    const me = await this.currentStudent.require(user);
    return this.chats.send(me.id, id, body.body);
  }
}
