import { Matches } from 'class-validator';

/** A Core Hub reference data code: upper-case letters, digits and "-", e.g. LAB-1. */
export const ROOM_CODE_PATTERN = /^[A-Z0-9-]{1,50}$/;
export const ROOM_CODE_MESSAGE = 'must be a Core Hub room code such as LAB-1';

export class RoomCodeParam {
  @Matches(ROOM_CODE_PATTERN, { message: `code ${ROOM_CODE_MESSAGE}` })
  code!: string;
}
