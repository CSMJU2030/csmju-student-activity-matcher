import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** The creator comes from the verified token, never from the body. */
export class CreateActivityDto {
  @IsString()
  @Length(2, 200)
  title!: string;

  @IsString()
  @Length(1, 2000)
  description!: string;

  /** yyyy-mm-dd, as sent by <input type="date"> */
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be yyyy-mm-dd' })
  date!: string;

  /** HH:mm, as sent by <input type="time"> */
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'time must be HH:mm' })
  time!: string;

  @IsString()
  @Length(1, 200)
  location!: string;

  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(1000)
  capacity!: number;

  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID('all', { each: true })
  interestIds!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;
}
