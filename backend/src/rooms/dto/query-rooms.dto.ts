import { IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class QueryRoomsDto extends PaginationQueryDto {
  /** Free-text search over room code, name and building. */
  @IsOptional()
  @IsString()
  @Length(1, 100)
  q?: string;
}
