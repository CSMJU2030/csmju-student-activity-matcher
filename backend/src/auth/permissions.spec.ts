import { SubsystemRole } from './core-hub-identity';
import { Permission, ROLE_PERMISSIONS, can, canAny } from './permissions';

describe('Subsystem permission model (spec §15, §16)', () => {
  describe('STUDENT', () => {
    const role = SubsystemRole.STUDENT;

    it('can see rooms, book one and follow or cancel its own bookings', () => {
      expect(can(role, Permission.ROOM_READ)).toBe(true);
      expect(can(role, Permission.BOOKING_CREATE)).toBe(true);
      expect(can(role, Permission.BOOKING_READ_OWN)).toBe(true);
      expect(can(role, Permission.BOOKING_CANCEL_OWN)).toBe(true);
    });

    it("cannot review bookings or touch other people's bookings", () => {
      expect(can(role, Permission.BOOKING_REVIEW)).toBe(false);
      expect(can(role, Permission.BOOKING_READ_ANY)).toBe(false);
      expect(can(role, Permission.BOOKING_CANCEL_ANY)).toBe(false);
    });
  });

  describe('ALUMNI', () => {
    it('can only look at rooms', () => {
      const role = SubsystemRole.ALUMNI;
      expect(can(role, Permission.ROOM_READ)).toBe(true);
      expect(can(role, Permission.BOOKING_CREATE)).toBe(false);
      expect(can(role, Permission.BOOKING_READ_OWN)).toBe(false);
    });
  });

  describe('Interest Match admin features', () => {
    it('are admin-only', () => {
      for (const role of [SubsystemRole.STUDENT, SubsystemRole.ALUMNI]) {
        expect(can(role, Permission.INTEREST_MANAGE)).toBe(false);
        expect(can(role, Permission.STUDENT_SYNC)).toBe(false);
      }
      expect(can(SubsystemRole.ADMIN, Permission.INTEREST_MANAGE)).toBe(true);
      expect(can(SubsystemRole.ADMIN, Permission.STUDENT_SYNC)).toBe(true);
    });
  });

  describe('ADMIN', () => {
    it('holds every permission', () => {
      for (const permission of Object.values(Permission)) {
        expect(can(SubsystemRole.ADMIN, permission)).toBe(true);
      }
    });
  });

  it('canAny passes when at least one permission matches', () => {
    expect(
      canAny(SubsystemRole.STUDENT, [Permission.BOOKING_READ_ANY, Permission.BOOKING_READ_OWN]),
    ).toBe(true);
    expect(
      canAny(SubsystemRole.ALUMNI, [Permission.BOOKING_CREATE, Permission.BOOKING_REVIEW]),
    ).toBe(false);
  });

  it('defines permissions for every subsystem role', () => {
    for (const role of Object.values(SubsystemRole)) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });
});
