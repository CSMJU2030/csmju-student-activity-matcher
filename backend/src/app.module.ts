import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { CoreHubJwtGuard } from './auth/guards/core-hub-jwt.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { BookingsModule } from './bookings/bookings.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RoomsModule } from './rooms/rooms.module';
import { ActivitiesModule } from './activities/activities.module';
import { StudentsModule } from './students/students.module';
import { GroupsModule } from './groups/groups.module';
import { InterestsModule } from './interests/interests.module';
import { SyncRegModule } from './admin/sync-reg/sync-reg.module';
import { CurrentStudentModule } from './students/current-student.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatsModule } from './chats/chats.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    RoomsModule,
    BookingsModule,
    ActivitiesModule,
    StudentsModule,
    GroupsModule,
    InterestsModule,
    SyncRegModule,
    CurrentStudentModule,
    NotificationsModule,
    ChatsModule,
  ],
  providers: [
    // Every route is authenticated unless explicitly marked @Public().
    { provide: APP_GUARD, useClass: CoreHubJwtGuard },
    // Authorization runs after authentication.
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
