-- The add_activity_models migration created the activity tables with Prisma's
-- default names ("Student", "creatorId", ...). The schema later mapped them to
-- snake_case (@@map / @map) without a migration, so a fresh database stopped at
-- notifications_and_chat with: relation "students" does not exist.
-- No database has data in the old tables (local databases came from MIS / db push
-- and have no _prisma_migrations), so they are recreated with the mapped names.

-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityInterest" DROP CONSTRAINT "ActivityInterest_activityId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityInterest" DROP CONSTRAINT "ActivityInterest_interestId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityParticipant" DROP CONSTRAINT "ActivityParticipant_activityId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityParticipant" DROP CONSTRAINT "ActivityParticipant_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "GroupInterest" DROP CONSTRAINT "GroupInterest_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupInterest" DROP CONSTRAINT "GroupInterest_interestId_fkey";

-- DropForeignKey
ALTER TABLE "GroupMember" DROP CONSTRAINT "GroupMember_groupId_fkey";

-- DropForeignKey
ALTER TABLE "GroupMember" DROP CONSTRAINT "GroupMember_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Interest" DROP CONSTRAINT "Interest_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "StudentInterest" DROP CONSTRAINT "StudentInterest_interestId_fkey";

-- DropForeignKey
ALTER TABLE "StudentInterest" DROP CONSTRAINT "StudentInterest_studentId_fkey";

-- DropForeignKey
ALTER TABLE "StudentLookingFor" DROP CONSTRAINT "StudentLookingFor_lookingForId_fkey";

-- DropForeignKey
ALTER TABLE "StudentLookingFor" DROP CONSTRAINT "StudentLookingFor_studentId_fkey";

-- DropTable
DROP TABLE "Activity";

-- DropTable
DROP TABLE "ActivityInterest";

-- DropTable
DROP TABLE "ActivityParticipant";

-- DropTable
DROP TABLE "Group";

-- DropTable
DROP TABLE "GroupInterest";

-- DropTable
DROP TABLE "GroupMember";

-- DropTable
DROP TABLE "Interest";

-- DropTable
DROP TABLE "InterestCategory";

-- DropTable
DROP TABLE "LookingForOption";

-- DropTable
DROP TABLE "Student";

-- DropTable
DROP TABLE "StudentInterest";

-- DropTable
DROP TABLE "StudentLookingFor";

-- DropTable
DROP TABLE "SyncLog";

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "fetched" INTEGER NOT NULL,
    "inserted" INTEGER NOT NULL,
    "updated" INTEGER NOT NULL,
    "skipped" INTEGER NOT NULL,
    "failed" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "bio" TEXT,
    "data_source" TEXT NOT NULL DEFAULT 'SEED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interest_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "interest_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_lower" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_interests" (
    "student_id" TEXT NOT NULL,
    "interest_id" TEXT NOT NULL,

    CONSTRAINT "student_interests_pkey" PRIMARY KEY ("student_id","interest_id")
);

-- CreateTable
CREATE TABLE "looking_for_options" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "looking_for_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_looking_fors" (
    "student_id" TEXT NOT NULL,
    "looking_for_id" TEXT NOT NULL,

    CONSTRAINT "student_looking_fors_pkey" PRIMARY KEY ("student_id","looking_for_id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cover_image" TEXT,
    "creator_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "group_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id","student_id")
);

-- CreateTable
CREATE TABLE "group_interests" (
    "group_id" TEXT NOT NULL,
    "interest_id" TEXT NOT NULL,

    CONSTRAINT "group_interests_pkey" PRIMARY KEY ("group_id","interest_id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "cover_image" TEXT,
    "creator_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_participants" (
    "activity_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,

    CONSTRAINT "activity_participants_pkey" PRIMARY KEY ("activity_id","student_id")
);

-- CreateTable
CREATE TABLE "activity_interests" (
    "activity_id" TEXT NOT NULL,
    "interest_id" TEXT NOT NULL,

    CONSTRAINT "activity_interests_pkey" PRIMARY KEY ("activity_id","interest_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_student_id_key" ON "students"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "interest_categories_name_key" ON "interest_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "interests_name_lower_key" ON "interests"("name_lower");

-- CreateIndex
CREATE UNIQUE INDEX "looking_for_options_label_key" ON "looking_for_options"("label");

-- AddForeignKey
ALTER TABLE "interests" ADD CONSTRAINT "interests_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "interest_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_interests" ADD CONSTRAINT "student_interests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_interests" ADD CONSTRAINT "student_interests_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_looking_fors" ADD CONSTRAINT "student_looking_fors_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_looking_fors" ADD CONSTRAINT "student_looking_fors_looking_for_id_fkey" FOREIGN KEY ("looking_for_id") REFERENCES "looking_for_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_interests" ADD CONSTRAINT "group_interests_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_interests" ADD CONSTRAINT "group_interests_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_participants" ADD CONSTRAINT "activity_participants_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_participants" ADD CONSTRAINT "activity_participants_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_interests" ADD CONSTRAINT "activity_interests_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_interests" ADD CONSTRAINT "activity_interests_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
