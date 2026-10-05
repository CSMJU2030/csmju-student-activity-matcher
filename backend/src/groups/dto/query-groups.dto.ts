import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class QueryGroupsDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  /** Only groups this Student.id belongs to. */
  @IsOptional()
  @IsUUID()
  memberId?: string;
}
