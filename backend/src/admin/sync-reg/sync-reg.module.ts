import { Module } from '@nestjs/common';
import { SyncRegService } from './sync-reg.service';
import { SyncRegController } from './sync-reg.controller';

@Module({
  controllers: [SyncRegController],
  providers: [SyncRegService],
  exports: [SyncRegService],
})
export class SyncRegModule {}
