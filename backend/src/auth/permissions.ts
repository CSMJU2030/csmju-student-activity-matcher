import { SubsystemRole } from './core-hub-identity';

/**
 * Subsystem permissions (spec §16).
 *
 *   Core JWT -> Core Role -> Subsystem Role -> Permission -> Business Operation
 *
 * Business code asks for a permission, never for `role === 'admin'`.
 * `:own` variants are scope hints: the guard lets the request through and the
 * service performs the ownership check against business data.
 */
export enum Permission {
  STUDENT_PROFILE_READ = 'student_profile:read',
  STUDENT_PROFILE_UPDATE_OWN = 'student_profile:update:own',
  /** Admin: edit any student's profile, interests and looking-for. */
  STUDENT_PROFILE_UPDATE_ANY = 'student_profile:update:any',
  STUDENT_SYNC = 'student:sync',

  /** 1:1 chat with other students. */
  CHAT_USE = 'chat:use',

  INTEREST_MANAGE = 'interest:manage',

  ACTIVITY_READ_ANY = 'activity:read:any',
  ACTIVITY_CREATE = 'activity:create',
  ACTIVITY_UPDATE_OWN = 'activity:update:own',
  ACTIVITY_UPDATE_ANY = 'activity:update:any',
  ACTIVITY_DELETE_ANY = 'activity:delete:any',
  ACTIVITY_DELETE_OWN = 'activity:delete:own',

  GROUP_READ_ANY = 'group:read:any',
  GROUP_CREATE = 'group:create',
  GROUP_UPDATE_OWN = 'group:update:own',
  GROUP_UPDATE_ANY = 'group:update:any',
  GROUP_DELETE_ANY = 'group:delete:any',
  GROUP_DELETE_OWN = 'group:delete:own',

  ROOM_READ = 'room:read',
  BOOKING_READ_ANY = 'booking:read:any',
  BOOKING_READ_OWN = 'booking:read:own',
  BOOKING_CREATE = 'booking:create',
  BOOKING_REVIEW = 'booking:review',
  BOOKING_CANCEL_ANY = 'booking:cancel:any',
  BOOKING_CANCEL_OWN = 'booking:cancel:own',
}

/** Students manage their profiles, create activities and groups */
const STUDENT_PERMISSIONS: Permission[] = [
  Permission.STUDENT_PROFILE_READ,
  Permission.STUDENT_PROFILE_UPDATE_OWN,
  Permission.CHAT_USE,
  Permission.ACTIVITY_READ_ANY,
  Permission.ACTIVITY_CREATE,
  Permission.ACTIVITY_UPDATE_OWN,
  Permission.ACTIVITY_DELETE_OWN,
  Permission.GROUP_READ_ANY,
  Permission.GROUP_CREATE,
  Permission.GROUP_UPDATE_OWN,
  Permission.GROUP_DELETE_OWN,
  Permission.ROOM_READ,
  Permission.BOOKING_READ_OWN,
  Permission.BOOKING_CREATE,
  Permission.BOOKING_CANCEL_OWN,
];

/** Alumni generally have read-only access */
const ALUMNI_PERMISSIONS: Permission[] = [
  Permission.STUDENT_PROFILE_READ,
  Permission.ACTIVITY_READ_ANY,
  Permission.GROUP_READ_ANY,
  Permission.ROOM_READ,
];

const ADMIN_PERMISSIONS: Permission[] = Object.values(Permission);

export const ROLE_PERMISSIONS: Readonly<Record<SubsystemRole, readonly Permission[]>> =
  Object.freeze({
    [SubsystemRole.STUDENT]: Object.freeze(STUDENT_PERMISSIONS),
    [SubsystemRole.ALUMNI]: Object.freeze(ALUMNI_PERMISSIONS),
    [SubsystemRole.ADMIN]: Object.freeze(ADMIN_PERMISSIONS),
  });

/** Does this subsystem role hold the given permission? */
export function can(role: SubsystemRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Does this subsystem role hold at least one of the given permissions? */
export function canAny(role: SubsystemRole, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => can(role, permission));
}
