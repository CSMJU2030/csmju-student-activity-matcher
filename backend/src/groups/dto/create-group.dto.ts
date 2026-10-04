import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

/** The creator comes from the verified token, never from the body. */
export class CreateGroupDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsString()
  @Length(1, 1000)
  description!: string;

  @IsArray()
  @ArrayMaxSize(10)
  @IsUUID('all', { each: true })
  interestIds!: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;
}
