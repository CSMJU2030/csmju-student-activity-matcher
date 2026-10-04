import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CurrentStudentService } from '../students/current-student.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { QueryGroupsDto } from './dto/query-groups.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsService } from './groups.service';

/**
 * Who creates / joins / leaves always comes from the verified token.
 * Editing, deleting and removing members: the group's creator or an admin -
 * the same rules apply whether the request comes from the student or admin UI.
 */
@Controller('v1/groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly currentStudent: CurrentStudentService,
  ) {}

  private async assertCanManage(user: CoreHubIdentity, groupId: string) {
    const creatorId = await this.groupsService.creatorOf(groupId);
    await this.currentStudent.assertSelfOrAdmin(user, creatorId, 'Only the group creator or an admin can do this');
  }

  @Get()
  @RequirePermissions(Permission.GROUP_READ_ANY)
  findAll(@Query() query: QueryGroupsDto) {
    return this.groupsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(Permission.GROUP_READ_ANY)
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.GROUP_CREATE)
  async createGroup(@CurrentUser() user: CoreHubIdentity, @Body() body: CreateGroupDto) {
    const me = await this.currentStudent.require(user);
    return this.groupsService.createGroup(me.id, body);
  }

  @Patch(':id')
  @RequirePermissions(Permission.GROUP_UPDATE_OWN, Permission.GROUP_UPDATE_ANY)
  async update(@CurrentUser() user: CoreHubIdentity, @Param('id') id: string, @Body() body: UpdateGroupDto) {
    await this.assertCanManage(user, id);
    return this.groupsService.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions(Permission.GROUP_DELETE_OWN, Permission.GROUP_DELETE_ANY)
  async remove(@CurrentUser() user: CoreHubIdentity, @Param('id') id: string) {
    await this.assertCanManage(user, id);
    return this.groupsService.remove(id, await this.currentStudent.actor(user));
  }

  @Post(':id/join')
  @RequirePermissions(Permission.GROUP_UPDATE_OWN)
  async joinGroup(@CurrentUser() user: CoreHubIdentity, @Param('id') id: string) {
    const me = await this.currentStudent.require(user);
    return this.groupsService.joinGroup(me.id, id);
  }

  @Delete(':id/leave')
  @RequirePermissions(Permission.GROUP_UPDATE_OWN)
  async leaveGroup(@CurrentUser() user: CoreHubIdentity, @Param('id') id: string) {
    const me = await this.currentStudent.require(user);
    return this.groupsService.leaveGroup(me.id, id);
  }

  @Delete(':id/members/:studentId')
  @RequirePermissions(Permission.GROUP_UPDATE_OWN, Permission.GROUP_UPDATE_ANY)
  async removeMember(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    await this.assertCanManage(user, id);
    return this.groupsService.removeMember(id, studentId, await this.currentStudent.actor(user));
  }
}
