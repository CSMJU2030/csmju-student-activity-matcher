import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CoreHubIdentity } from '../auth/core-hub-identity';
import { CoreHubAccessToken } from '../auth/decorators/core-hub-access-token.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { CollectionResult } from '../common/api-response';
import { buildPaginationMeta } from '../common/dto/pagination.dto';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingsDto } from './dto/query-bookings.dto';
import { ReviewBookingDto } from './dto/review-booking.dto';

@Controller('v1/bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  @RequirePermissions(Permission.BOOKING_READ_ANY, Permission.BOOKING_READ_OWN)
  async findAll(
    @CurrentUser() user: CoreHubIdentity,
    @Query() query: QueryBookingsDto,
    @CoreHubAccessToken() token: string,
  ) {
    const { items, total } = await this.bookings.findAll(user, query, token);
    return new CollectionResult(items, buildPaginationMeta(total, query.page ?? 1, query.take));
  }

  @Get(':id')
  @RequirePermissions(Permission.BOOKING_READ_ANY, Permission.BOOKING_READ_OWN)
  findOne(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id', ParseUUIDPipe) id: string,
    @CoreHubAccessToken() token: string,
  ) {
    return this.bookings.findOne(user, id, token);
  }

  @Post()
  @RequirePermissions(Permission.BOOKING_CREATE)
  create(
    @CurrentUser() user: CoreHubIdentity,
    @Body() dto: CreateBookingDto,
    @CoreHubAccessToken() token: string,
  ) {
    return this.bookings.create(user, dto, token);
  }

  @Patch(':id/approve')
  @RequirePermissions(Permission.BOOKING_REVIEW)
  approve(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewBookingDto,
    @CoreHubAccessToken() token: string,
  ) {
    return this.bookings.approve(user, id, dto, token);
  }

  @Patch(':id/reject')
  @RequirePermissions(Permission.BOOKING_REVIEW)
  reject(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewBookingDto,
    @CoreHubAccessToken() token: string,
  ) {
    return this.bookings.reject(user, id, dto, token);
  }

  @Patch(':id/cancel')
  @RequirePermissions(Permission.BOOKING_CANCEL_ANY, Permission.BOOKING_CANCEL_OWN)
  cancel(
    @CurrentUser() user: CoreHubIdentity,
    @Param('id', ParseUUIDPipe) id: string,
    @CoreHubAccessToken() token: string,
  ) {
    return this.bookings.cancel(user, id, token);
  }
}
