import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

/** PATCH /api/v1/groups/:id - creator or admin. Every field is optional. */
export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 1000)
  description?: string;

  /** Replaces the group's interests. */
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
