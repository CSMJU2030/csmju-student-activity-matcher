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

/** PATCH /api/v1/activities/:id - creator or admin. Every field is optional. */
export class UpdateActivityDto {
  @IsOptional()
  @IsString()
  @Length(2, 200)
  title?: string;

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  description?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be yyyy-mm-dd' })
  date?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'time must be HH:mm' })
  time?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  location?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(1000)
  capacity?: number;

  /** Replaces the activity's interests. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID('all', { each: true })
  interestIds?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;
}
