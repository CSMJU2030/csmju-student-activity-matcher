import { Controller, Post, Body, Get } from '@nestjs/common';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator';
import { Permission } from '../../auth/permissions';
import { SyncRegService } from './sync-reg.service';

/** Pulling students from REG is an admin-only operation. */
@Controller('v1/admin/sync-reg')
@RequirePermissions(Permission.STUDENT_SYNC)
export class SyncRegController {
  constructor(private readonly syncRegService: SyncRegService) {}

  @Post()
  syncStudents(@Body('entryYear') entryYear: string) {
    return this.syncRegService.syncStudents(entryYear);
  }

  @Get('logs')
  getLogs() {
    return this.syncRegService.getLogs();
  }
}
