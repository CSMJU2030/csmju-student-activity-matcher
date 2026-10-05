import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CollectionResult } from '../common/api-response';
import { buildPaginationMeta } from '../common/dto/pagination.dto';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CurrentStudentService } from '../students/current-student.service';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { QueryActivitiesDto } from './dto/query-activities.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

/**
 * Activity rows reference Student.id. The Core Hub user id (`sub`) is NOT a
 * Student.id, so the caller is resolved to their Student profile first.
 * Editing, deleting and removing participants: creator or admin.
 */
@Controller('v1/activities')
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly currentStudent: CurrentStudentService,
  ) {}

  private async assertCanManage(user: CoreHubIdentity, activityId: string) {
    const creatorId = await this.activitiesService.creatorOf(activityId);
    await this.currentStudent.assertSelfOrAdmin(user, creatorId, 'Only the activity creator or an admin can do this');
  }

  @Get()
  @RequirePermissions(Permission.ACTIVITY_READ_ANY)
  async getActivities(@Query() query: QueryActivitiesDto) {
    const { items, total, page, limit } = await this.activitiesService.findAll(query);
    return new CollectionResult(items, buildPaginationMeta(total, page, limit));
  }

  @Get(':id')
  @RequirePermissions(Permission.ACTIVITY_READ_ANY)
  getActivity(@Param('id', ParseUUIDPipe) id: string) {
    return this.activitiesService.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.ACTIVITY_CREATE)
  async createActivity(@CurrentUser() user: CoreHubIdentity, @Body() body: CreateActivityDto) {
    const me = await this.currentStudent.require(user);
    return this.activitiesService.create(me.id, body);
  }

  @Patch(':id')
  @RequirePermissions(Permission.ACTIVITY_UPDATE_OWN, Permission.ACTIVITY_UPDATE_ANY)
  async update(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string, @Body() body: UpdateActivityDto) {
    await this.assertCanManage(user, id);
    return this.activitiesService.update(id, body, await this.currentStudent.actor(user));
  }

  @Delete(':id')
  @RequirePermissions(Permission.ACTIVITY_DELETE_OWN, Permission.ACTIVITY_DELETE_ANY)
  async remove(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    await this.assertCanManage(user, id);
    return this.activitiesService.remove(id, await this.currentStudent.actor(user));
  }

  @Post(':id/join')
  @RequirePermissions(Permission.ACTIVITY_UPDATE_OWN)
  async joinActivity(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    const me = await this.currentStudent.require(user);
    return this.activitiesService.joinActivity(me.id, id);
  }

  @Delete(':id/leave')
  @RequirePermissions(Permission.ACTIVITY_UPDATE_OWN)
  async leaveActivity(@CurrentUser() user: CoreHubIdentity, @Param('id', ParseUUIDPipe) id: string) {
    const me = await this.currentStudent.require(user);
    return this.activitiesService.leaveActivity(me.id, id);
  }

  @Delete(':id/participants/:studentId')
  @RequirePermissions(Permission.ACTIVITY_UPDATE_OWN, Permission.ACTIVITY_UPDATE_ANY)
  async removeParticipant(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('studentId', ParseUUIDPipe) studentId: string,
  ) {
    await this.assertCanManage(user, id);
    return this.activitiesService.removeParticipant(id, studentId, await this.currentStudent.actor(user));
  }
}
