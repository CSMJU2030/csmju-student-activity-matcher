import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CurrentStudentService } from './current-student.service';
import { AdminUpdateStudentDto } from './dto/admin-update-student.dto';
import { CreateCustomInterestDto } from './dto/create-custom-interest.dto';
import { DiscoverStudentsQueryDto } from './dto/discover-students.dto';
import { UpdateBioDto } from './dto/update-bio.dto';
import { StudentsService } from './students.service';

@Controller('v1/students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly currentStudent: CurrentStudentService,
  ) {}

  @Get()
  @RequirePermissions(Permission.STUDENT_PROFILE_READ)
  findAll() {
    return this.studentsService.findAll();
  }

  /** The logged-in user's own Student profile (resolved from the verified token). */
  @Get('me')
  @RequirePermissions(Permission.STUDENT_PROFILE_READ)
  async me(@CurrentUser() user: CoreHubIdentity) {
    const student = await this.currentStudent.require(user);
    return this.studentsService.findOne(student.id);
  }

  @Get('discover')
  @RequirePermissions(Permission.STUDENT_PROFILE_READ)
  async discover(@CurrentUser() user: CoreHubIdentity, @Query() query: DiscoverStudentsQueryDto) {
    const me = query.excludeSelf === false ? null : await this.currentStudent.find(user);
    return this.studentsService.discover(query, me?.id);
  }

  @Get('by-student-id/:studentId')
  @RequirePermissions(Permission.STUDENT_PROFILE_READ)
  findByStudentId(@Param('studentId') studentId: string) {
    return this.studentsService.findByStudentId(studentId);
  }

  @Get(':id')
  @RequirePermissions(Permission.STUDENT_PROFILE_READ)
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Get(':id/matches')
  @RequirePermissions(Permission.STUDENT_PROFILE_READ)
  getMatches(@Param('id') id: string) {
    return this.studentsService.getMatches(id);
  }

  @Get(':id/common-interests/:otherId')
  @RequirePermissions(Permission.STUDENT_PROFILE_READ)
  getCommonInterests(@Param('id') id: string, @Param('otherId') otherId: string) {
    return this.studentsService.getCommonInterests(id, otherId);
  }

  @Get(':id/dashboard')
  @RequirePermissions(Permission.STUDENT_PROFILE_READ)
  async getDashboardData(@CurrentUser() user: CoreHubIdentity, @Param('id') id: string) {
    await this.currentStudent.assertSelfOrAdmin(user, id);
    return this.studentsService.getDashboardData(id);
  }

  /** Admin: edit name / faculty / program / year / bio of any student. */
  @Patch(':id')
  @RequirePermissions(Permission.STUDENT_PROFILE_UPDATE_ANY)
  adminUpdate(@Param('id') id: string, @Body() body: AdminUpdateStudentDto) {
    return this.studentsService.adminUpdate(id, body);
  }

  @Patch(':id/bio')
  @RequirePermissions(Permission.STUDENT_PROFILE_UPDATE_OWN)
  async updateBio(@CurrentUser() user: CoreHubIdentity, @Param('id') id: string, @Body() body: UpdateBioDto) {
    await this.currentStudent.assertSelfOrAdmin(user, id);
    return this.studentsService.updateBio(id, body.bio);
  }

  @Post(':id/interests/custom')
  @RequirePermissions(Permission.STUDENT_PROFILE_UPDATE_OWN)
  async createCustomInterest(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id') id: string,
    @Body() body: CreateCustomInterestDto,
  ) {
    await this.currentStudent.assertSelfOrAdmin(user, id);
    return this.studentsService.createCustomInterest(id, body.name, body.categoryId);
  }

  @Post(':id/interests/:interestId')
  @RequirePermissions(Permission.STUDENT_PROFILE_UPDATE_OWN)
  async addInterest(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id') id: string,
    @Param('interestId') interestId: string,
  ) {
    await this.currentStudent.assertSelfOrAdmin(user, id);
    return this.studentsService.addInterest(id, interestId);
  }

  @Delete(':id/interests/:interestId')
  @RequirePermissions(Permission.STUDENT_PROFILE_UPDATE_OWN)
  async removeInterest(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id') id: string,
    @Param('interestId') interestId: string,
  ) {
    await this.currentStudent.assertSelfOrAdmin(user, id);
    return this.studentsService.removeInterest(id, interestId);
  }

  @Post(':id/looking-for/:lookingForId')
  @RequirePermissions(Permission.STUDENT_PROFILE_UPDATE_OWN)
  async toggleLookingFor(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id') id: string,
    @Param('lookingForId') lookingForId: string,
  ) {
    await this.currentStudent.assertSelfOrAdmin(user, id);
    return this.studentsService.toggleLookingFor(id, lookingForId);
  }
}
