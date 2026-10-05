import { Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CurrentStudentService } from '../students/current-student.service';
import { NotificationsService } from './notifications.service';

/** The logged-in student's own notifications. */
@Controller('v1/notifications')
@RequirePermissions(Permission.STUDENT_PROFILE_READ)
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly currentStudent: CurrentStudentService,
  ) {}

  @Get()
  async list(@CurrentUser() user: CoreHubIdentity) {
    const me = await this.currentStudent.require(user);
    return this.notifications.listFor(me.id);
  }

  /** Cheap endpoint for the bell badge to poll. */
  @Get('unread-count')
  async unreadCount(@CurrentUser() user: CoreHubIdentity) {
    const me = await this.currentStudent.require(user);
    return this.notifications.unreadCount(me.id);
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: CoreHubIdentity) {
    const me = await this.currentStudent.require(user);
    return this.notifications.markAllRead(me.id);
  }

  @Patch(':id/read')
  async markRead(@CurrentUser() user: CoreHubIdentity, @Param('id') id: string) {
    const me = await this.currentStudent.require(user);
    return this.notifications.markRead(me.id, id);
  }
}
