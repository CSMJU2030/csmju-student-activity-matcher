import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CoreHubIdentity, SubsystemRole } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import {
  CreateCategoryDto,
  CreateInterestDto,
  CreateLookingForDto,
  QueryInterestsDto,
  UpdateCategoryDto,
  UpdateInterestDto,
  UpdateLookingForDto,
} from './dto/interest.dto';
import { InterestsService } from './interests.service';

@Controller('v1/interests')
export class InterestsController {
  constructor(private readonly interestsService: InterestsService) {}

  @Get()
  @RequirePermissions(Permission.STUDENT_PROFILE_READ)
  findAll(@CurrentUser() user: CoreHubIdentity, @Query() query: QueryInterestsDto) {
    return this.interestsService.findAll(query, user.subsystemRole === SubsystemRole.ADMIN);
  }

  @Get('categories')
  @RequirePermissions(Permission.STUDENT_PROFILE_READ)
  findCategories() {
    return this.interestsService.findCategories();
  }

  /** Admin: categories with interest counts. Declared before categories/:id. */
  @Get('categories/admin')
  @RequirePermissions(Permission.INTEREST_MANAGE)
  categoriesWithCounts() {
    return this.interestsService.categoriesWithCounts();
  }

  @Get('looking-for-options/admin')
  @RequirePermissions(Permission.INTEREST_MANAGE)
  lookingForWithCounts() {
    return this.interestsService.lookingForWithCounts();
  }

  @Post('categories')
  @RequirePermissions(Permission.INTEREST_MANAGE)
  createCategory(@Body() body: CreateCategoryDto) {
    return this.interestsService.createCategory(body);
  }

  @Patch('categories/:id')
  @RequirePermissions(Permission.INTEREST_MANAGE)
  updateCategory(@Param('id') id: string, @Body() body: UpdateCategoryDto) {
    return this.interestsService.updateCategory(id, body);
  }

  @Delete('categories/:id')
  @RequirePermissions(Permission.INTEREST_MANAGE)
  deleteCategory(@Param('id') id: string) {
    return this.interestsService.deleteCategory(id);
  }

  @Post('looking-for-options')
  @RequirePermissions(Permission.INTEREST_MANAGE)
  createLookingFor(@Body() body: CreateLookingForDto) {
    return this.interestsService.createLookingFor(body);
  }

  @Patch('looking-for-options/:id')
  @RequirePermissions(Permission.INTEREST_MANAGE)
  updateLookingFor(@Param('id') id: string, @Body() body: UpdateLookingForDto) {
    return this.interestsService.updateLookingFor(id, body);
  }

  @Delete('looking-for-options/:id')
  @RequirePermissions(Permission.INTEREST_MANAGE)
  deleteLookingFor(@Param('id') id: string) {
    return this.interestsService.deleteLookingFor(id);
  }

  @Get('categories/:id')
  @RequirePermissions(Permission.STUDENT_PROFILE_READ)
  findCategory(@Param('id') id: string) {
    return this.interestsService.findCategory(id);
  }

  @Get('looking-for-options')
  @RequirePermissions(Permission.STUDENT_PROFILE_READ)
  findLookingForOptions() {
    return this.interestsService.findLookingForOptions();
  }

  @Get('statistics')
  @RequirePermissions(Permission.INTEREST_MANAGE)
  getInterestStatistics() {
    return this.interestsService.getInterestStatistics();
  }

  @Post('admin')
  @RequirePermissions(Permission.INTEREST_MANAGE)
  adminCreateInterest(@Body() body: CreateInterestDto) {
    return this.interestsService.adminCreateInterest(body);
  }

  @Patch('admin/:id')
  @RequirePermissions(Permission.INTEREST_MANAGE)
  adminUpdateInterest(@Param('id') id: string, @Body() body: UpdateInterestDto) {
    return this.interestsService.adminUpdateInterest(id, body);
  }
}
