import { Module } from '@nestjs/common';
import { RoomsModule } from '../rooms/rooms.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [RoomsModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
