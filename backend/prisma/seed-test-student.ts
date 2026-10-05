/**
 * Idempotent dev seed for the mock test account (student@core.local).
 *
 * Creates student '6704101363' (ภาณุพงษ์ เวียงห้า) - the profile MockAuthController binds
 * student@core.local to - plus a few sample activities so the UI has data.
 * Faculty/program/year are placeholders (same values the REG sync uses).
 *
 * Run: npm run prisma:seed:test-student
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/** yyyy-mm-dd, `days` from today. */
function day(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

async function main(): Promise<void> {
  const student = await prisma.student.upsert({
    where: { studentId: '6704101363' },
    update: { name: 'ภาณุพงษ์ เวียงห้า' },
    create: {
      studentId: '6704101363',
      name: 'ภาณุพงษ์ เวียงห้า',
      faculty: 'วิทยาศาสตร์',
      program: 'วิทยาการคอมพิวเตอร์',
      year: 3,
    },
  });
  console.log(`[seed] student ${student.studentId} ${student.name} (id ${student.id})`);

  if ((await prisma.activity.count()) > 0) {
    console.log('[seed] activities already present - leaving them alone');
    return;
  }

  const samples = [
    { title: 'Hackathon CS MJU', description: 'แข่งเขียนโปรแกรมข้ามคืน', time: '09:00', location: 'ห้อง LAB-1', capacity: 30, days: 7 },
    { title: 'Git Workshop', description: 'เรียนรู้ Git และ GitHub เบื้องต้น', time: '13:00', location: 'ห้อง LECT-6', capacity: 40, days: 3 },
    { title: 'Board Game Night', description: 'เล่นบอร์ดเกมผ่อนคลายหลังสอบ', time: '18:00', location: 'ลานกิจกรรม', capacity: 20, days: 10 },
  ];
  for (const { days, ...a } of samples) {
    await prisma.activity.create({
      data: { ...a, date: day(days), creatorId: student.id, participants: { create: { studentId: student.id } } },
    });
  }
  console.log(`[seed] created ${samples.length} sample activities`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
