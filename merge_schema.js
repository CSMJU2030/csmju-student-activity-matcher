const fs = require('fs');

const topBlock = `// CSMJU Demo Subsystem (room booking) - OWN database schema.
//
// Naming follows the CSMJU2030 Subsystem Standard: PostgreSQL tables are plural
// snake_case and every column is snake_case through @map, while Prisma/TypeScript
// field names stay camelCase. Application code is therefore unchanged.
//
// This database belongs to the subsystem only. It never contains Core Hub
// users, passwords, sessions or key material. \`Booking.coreUserId\` is an
// EXTERNAL identity reference to a Core Hub user id (\`sub\`) - nothing more.
//
// Rooms are Core Hub reference data (GET /api/v1/rooms), so there is no rooms
// table here: a booking keeps only the room \`code\`, and the name, building
// and capacity are read from Core Hub whenever they are shown.

generator client {
  provider     = "prisma-client"
  output       = "../generated/prisma"
  moduleFormat = "cjs"
}

// The connection string is supplied by prisma.config.ts (CLI) and by the
// PrismaPg adapter in PrismaService (runtime) - always this subsystem's own
// DATABASE_URL, never the Core Hub database.
datasource db {
  provider = "postgresql"
}

enum BookingStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

model Booking {
  id String @id @default(uuid())

  /// Core Hub room \`code\` (e.g. LAB-1) - checked against Core Hub when booked.
  roomCode String @map("room_code")

  /// Who asked for the room: the Core Hub \`sub\` claim, never a local account.
  coreUserId String @map("core_user_id")
  /// Email claim at booking time, kept so staff can see who asked.
  email      String

  title    String
  purpose  String?
  startsAt DateTime @map("starts_at")
  endsAt   DateTime @map("ends_at")

  status BookingStatus @default(PENDING)

  /// Core Hub \`sub\` of the staff member who approved or rejected it.
  reviewedByCoreUserId String?   @map("reviewed_by_core_user_id")
  reviewNote           String?   @map("review_note")
  reviewedAt           DateTime? @map("reviewed_at")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([roomCode, startsAt])
  @@index([coreUserId])
  @@index([status])
  @@map("bookings")
}
`;

const oldSchemaStr = fs.readFileSync('C:/Users/Windows/OneDrive/Desktop/MIS/prisma/schema.prisma', 'utf8');

// Extract everything after the datasource block from old schema
const modelsBlock = oldSchemaStr.split('datasource db {')[1];
const modelsOnly = modelsBlock.substring(modelsBlock.indexOf('}') + 1).trim();

const combined = topBlock + '\n' + modelsOnly + '\n';
fs.writeFileSync('C:/Users/Windows/csmju2030/csmju-student-activity-matcher/backend/prisma/schema.prisma', combined, 'utf8');
