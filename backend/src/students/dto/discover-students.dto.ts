import { Transform, Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

/** `?interestIds=a,b` and `?interestIds=a&interestIds=b` both become ['a', 'b']. */
const toList = ({ value }: { value: unknown }) =>
  (Array.isArray(value) ? value : String(value).split(','))
    .map((v) => String(v).trim())
    .filter(Boolean);

/** GET /api/v1/students/discover - the MIS "Discover" filters, done in the database. */
export class DiscoverStudentsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @Transform(toList)
  @IsArray()
  @IsUUID('all', { each: true })
  interestIds?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  year?: number;

  @IsOptional()
  @IsUUID()
  lookingForId?: string;

  /** Leave the caller out of their own results. Defaults to true. */
  @IsOptional()
  @Transform(({ value }) => value !== 'false' && value !== false)
  excludeSelf?: boolean = true;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
