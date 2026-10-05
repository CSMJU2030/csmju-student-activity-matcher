import { Global, Module } from '@nestjs/common';
import { CurrentStudentService } from './current-student.service';

/** Resolves "which Student is calling" for every feature module. */
@Global()
@Module({
  providers: [CurrentStudentService],
  exports: [CurrentStudentService],
})
export class CurrentStudentModule {}
