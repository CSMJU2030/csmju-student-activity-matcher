import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

/** PATCH /api/v1/students/:id - admin only. The student code itself is not editable. */
export class AdminUpdateStudentDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  faculty?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  program?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  year?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
