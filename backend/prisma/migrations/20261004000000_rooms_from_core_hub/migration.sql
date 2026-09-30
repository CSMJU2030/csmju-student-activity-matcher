-- Rooms are Core Hub reference data (GET /api/v1/rooms): the subsystem stops
-- keeping its own copy and a booking refers to a room by its Core Hub code.
-- Existing bookings keep the code their room had; a code Core Hub does not
-- know is shown as the bare code.

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN "room_code" TEXT;

UPDATE "bookings" AS b
SET "room_code" = r."room_code"
FROM "rooms" AS r
WHERE r."id" = b."room_id";

ALTER TABLE "bookings" ALTER COLUMN "room_code" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_room_id_fkey";

-- DropIndex
DROP INDEX "bookings_room_id_starts_at_idx";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "room_id";

-- DropTable
DROP TABLE "rooms";

-- DropEnum
DROP TYPE "RoomType";

-- CreateIndex
CREATE INDEX "bookings_room_code_starts_at_idx" ON "bookings"("room_code", "starts_at");
