import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { Permission } from '../auth/permissions'; 
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator'; 
import { CoreHubIdentity } from '../auth/core-hub-identity'; 

@Controller('api/v1/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @RequirePermissions(Permission.ACTIVITY_READ_ANY)
  async getActivities() {
    return this.activitiesService.findAll();
  }

  @Get(':id')
  @RequirePermissions(Permission.ACTIVITY_READ_ANY)
  async getActivity(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.ACTIVITY_CREATE)
  async createActivity(
    @CurrentUser() user: CoreHubIdentity, 
    @Body() body: CreateActivityDto
  ) {
    return this.activitiesService.create(user.id, body);
  }

  @Post(':id/join')
  @RequirePermissions(Permission.ACTIVITY_UPDATE_OWN)
  async joinActivity(@Param('id') id: string, @CurrentUser() user: CoreHubIdentity) {
    return this.activitiesService.joinActivity(user.id, id);
  }

  @Delete(':id/leave')
  @RequirePermissions(Permission.ACTIVITY_UPDATE_OWN)
  async leaveActivity(@Param('id') id: string, @CurrentUser() user: CoreHubIdentity) {
    return this.activitiesService.leaveActivity(user.id, id);
  }
}
