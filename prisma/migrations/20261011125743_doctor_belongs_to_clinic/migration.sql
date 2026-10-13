/*
  Warnings:

  - Added the required column `clinicId` to the `Doctor` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Doctor" DROP CONSTRAINT "Doctor_id_fkey";

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "clinicId" UUID NOT NULL,
ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "account" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "session" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();

-- AddForeignKey
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
