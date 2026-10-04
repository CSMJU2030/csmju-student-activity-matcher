import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class QueryActivitiesDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  /** Only activities dated today or later, soonest first. */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  upcoming?: boolean;
}
