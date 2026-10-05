import { IsISO8601, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class OpenChatDto {
  /** Student.id of the person to chat with. */
  @IsUUID()
  studentId!: string;
}

export class SendMessageDto {
  @IsString()
  @Length(1, 2000)
  body!: string;
}

export class MessagesQueryDto {
  /** Only messages newer than this (ISO time) - used for polling. */
  @IsOptional()
  @IsISO8601()
  after?: string;
}
