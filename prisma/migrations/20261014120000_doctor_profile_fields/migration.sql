-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN "bio" TEXT,
ADD COLUMN "education" TEXT,
ADD COLUMN "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "services" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "consultationFee" INTEGER;
