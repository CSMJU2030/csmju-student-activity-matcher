import { IsOptional, IsString, Length } from 'class-validator';

export class ReviewBookingDto {
  /** Shown to the requester, e.g. why a booking was rejected. */
  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;
}
