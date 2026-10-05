import { IsString, IsUUID, Length } from 'class-validator';

export class CreateCustomInterestDto {
  @IsString()
  @Length(2, 50)
  name!: string;

  @IsUUID()
  categoryId!: string;
}
