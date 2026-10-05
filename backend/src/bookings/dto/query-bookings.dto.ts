import { IsEnum, IsOptional, Matches } from 'class-validator';
import { BookingStatus } from '../../../generated/prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ROOM_CODE_MESSAGE, ROOM_CODE_PATTERN } from '../../rooms/dto/room-code-param.dto';

export class QueryBookingsDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @Matches(ROOM_CODE_PATTERN, { message: `roomCode ${ROOM_CODE_MESSAGE}` })
  roomCode?: string;
}
