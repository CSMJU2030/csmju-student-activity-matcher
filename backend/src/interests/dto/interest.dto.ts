import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID, Length, Matches, MaxLength } from 'class-validator';

export class QueryInterestsDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  search?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  /** Comma-separated Interest ids. */
  @IsOptional()
  @IsString()
  ids?: string;

  /** Admins also see disabled interests. Ignored for everyone else. */
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeInactive?: boolean;
}

export class CreateInterestDto {
  @IsString()
  @Length(2, 50)
  name!: string;

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  icon?: string;
}

export class UpdateInterestDto {
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** Tailwind classes for a category chip, e.g. "bg-purple-100 text-purple-700 border-purple-200". */
const CATEGORY_COLOR = /^bg-[a-z]+-\d{2,3} text-[a-z]+-\d{2,3} border-[a-z]+-\d{2,3}$/;

export class CreateCategoryDto {
  @IsString()
  @Length(2, 40)
  name!: string;

  @IsString()
  @Length(1, 16)
  icon!: string;

  @Matches(CATEGORY_COLOR, { message: 'color must be "bg-x-100 text-x-700 border-x-200"' })
  color!: string;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @Length(2, 40)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 16)
  icon?: string;

  @IsOptional()
  @Matches(CATEGORY_COLOR, { message: 'color must be "bg-x-100 text-x-700 border-x-200"' })
  color?: string;
}

export class CreateLookingForDto {
  @IsString()
  @Length(2, 60)
  label!: string;

  @IsString()
  @Length(1, 16)
  icon!: string;
}

export class UpdateLookingForDto {
  @IsOptional()
  @IsString()
  @Length(2, 60)
  label?: string;

  @IsOptional()
  @IsString()
  @Length(1, 16)
  icon?: string;
}
