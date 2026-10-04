import { Controller, Get, Param, Query } from '@nestjs/common';
import { CoreHubAccessToken } from '../auth/decorators/core-hub-access-token.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CollectionResult } from '../common/api-response';
import { buildPaginationMeta } from '../common/dto/pagination.dto';
import { QueryRoomsDto } from './dto/query-rooms.dto';
import { RoomCodeParam } from './dto/room-code-param.dto';
import { RoomsService } from './rooms.service';

/**
 * Read-only: rooms are added and closed in the Core Hub backoffice, not here.
 * Each call passes the caller's own token on to Core Hub.
 */
@Controller('v1/rooms')
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Get()
  @RequirePermissions(Permission.ROOM_READ)
  async findAll(@Query() query: QueryRoomsDto, @CoreHubAccessToken() token: string) {
    const { items, total } = await this.rooms.findAll(query, token);
    return new CollectionResult(items, buildPaginationMeta(total, query.page ?? 1, query.take));
  }

  @Get(':code')
  @RequirePermissions(Permission.ROOM_READ)
  findOne(@Param() { code }: RoomCodeParam, @CoreHubAccessToken() token: string) {
    return this.rooms.findOne(code, token);
  }

  /** Taken time slots for the next two weeks, without who booked them. */
  @Get(':code/schedule')
  @RequirePermissions(Permission.ROOM_READ)
  schedule(@Param() { code }: RoomCodeParam, @CoreHubAccessToken() token: string) {
    return this.rooms.schedule(code, token);
  }
}
