import { IsDateString, IsOptional, IsString, Length, Matches } from 'class-validator';
import { ROOM_CODE_MESSAGE, ROOM_CODE_PATTERN } from '../../rooms/dto/room-code-param.dto';

/**
 * Who is booking comes from the verified token, never from the body — the
 * ValidationPipe's forbidNonWhitelisted rejects a smuggled coreUserId.
 */
export class CreateBookingDto {
  /** Core Hub room code (GET /api/v1/rooms), e.g. LAB-1. */
  @Matches(ROOM_CODE_PATTERN, { message: `roomCode ${ROOM_CODE_MESSAGE}` })
  roomCode!: string;

  @IsString()
  @Length(1, 200)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000)
  purpose?: string;

  /** ISO 8601 with a timezone, e.g. 2026-10-01T09:00:00+07:00 */
  @IsDateString({ strict: true })
  startsAt!: string;

  @IsDateString({ strict: true })
  endsAt!: string;
}
