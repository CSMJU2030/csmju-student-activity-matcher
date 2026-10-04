/**
 * Development seed data for the room booking demo.
 *
 * IMPORTANT: no Core Hub users, passwords or sessions are seeded here.
 * `coreUserId` values below are EXTERNAL REFERENCES to Core Hub identities
 * (the `sub` claim of a Core Hub access token) and carry no credentials.
 * They match the development accounts in the Core Hub seed:
 *   user-002 = student@core.local · user-003 = staff@core.local
 *
 * There are no rooms to seed: rooms are Core Hub reference data. The sample
 * bookings use room codes from Core Hub's master data (LAB-1, LECT-6); on a
 * Core Hub without that data the pages show the bare code.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { BookingStatus, PrismaClient } from '../generated/prisma/client';

// Prisma 7 driver adapter, bound to the subsystem's own DATABASE_URL.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

/** `days` from today at `hour`:00 Bangkok time (UTC+7). */
function at(days: number, hour: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour - 7, 0, 0, 0);
  return date;
}

async function main(): Promise<void> {
  console.log('[seed] seeding csmju_demo_subsystem ...');

  // Bookings are sample data for a fresh database only — re-running the seed
  // leaves existing bookings alone.
  if ((await prisma.booking.count()) === 0) {
    await prisma.booking.createMany({
      data: [
        {
          roomCode: 'LECT-6',
          coreUserId: 'user-002',
          email: 'student@core.local',
          title: 'ประชุมกลุ่มโครงงาน',
          purpose: 'สรุปความคืบหน้าก่อนนำเสนอ',
          startsAt: at(1, 13),
          endsAt: at(1, 15),
          status: BookingStatus.PENDING,
        },
        {
          roomCode: 'LAB-1',
          coreUserId: 'user-003',
          email: 'staff@core.local',
          title: 'อบรมเชิงปฏิบัติการ Git',
          startsAt: at(2, 9),
          endsAt: at(2, 12),
          status: BookingStatus.APPROVED,
          reviewedByCoreUserId: 'user-003',
          reviewedAt: new Date(),
        },
      ],
    });
  }

  console.log(`[seed] done: ${await prisma.booking.count()} bookings`);
}

main()
  .catch((error) => {
    console.error('[seed] failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
