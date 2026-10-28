-- ექიმი რამდენიმე კლინიკაში: კლინიკასთან კავშირი, დადასტურება და გრაფიკი
-- ცალკე ცხრილში გადადის (DoctorClinic), თითო კლინიკას თავისი გრაფიკით
CREATE TABLE "DoctorClinic" (
    "id" UUID NOT NULL DEFAULT pg_catalog.gen_random_uuid(),
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "rejectedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),
    "room" TEXT,
    "workStart" TEXT NOT NULL DEFAULT '10:00',
    "workEnd" TEXT NOT NULL DEFAULT '18:00',
    "workDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6]::INTEGER[],
    "daysOff" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doctorId" UUID NOT NULL,
    "clinicId" UUID NOT NULL,

    CONSTRAINT "DoctorClinic_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DoctorClinic_doctorId_clinicId_key" ON "DoctorClinic"("doctorId", "clinicId");
CREATE INDEX "DoctorClinic_clinicId_idx" ON "DoctorClinic"("clinicId");

ALTER TABLE "DoctorClinic" ADD CONSTRAINT "DoctorClinic_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DoctorClinic" ADD CONSTRAINT "DoctorClinic_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- არსებული ექიმების კლინიკა და გრაფიკი ახალ ცხრილში გადადის
INSERT INTO "DoctorClinic" ("isApproved", "rejectedAt", "removedAt", "room", "workStart", "workEnd", "workDays", "daysOff", "doctorId", "clinicId")
SELECT "isApproved", "rejectedAt", "removedAt", "room", "workStart", "workEnd", "workDays", "daysOff", "id", "clinicId"
FROM "Doctor";

-- ვიზიტი იმახსოვრებს, რომელ კლინიკაში იყო
ALTER TABLE "Appointment" ADD COLUMN "clinicId" UUID;

-- არსებულ ვიზიტებს კლინიკას ექიმიდან ვუწერთ
UPDATE "Appointment" AS a
SET "clinicId" = d."clinicId"
FROM "Doctor" AS d
WHERE d."id" = a."doctorId";

CREATE INDEX "Appointment_clinicId_startsAt_idx" ON "Appointment"("clinicId", "startsAt");
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ძველი სვეტები ექიმის ცხრილიდან
ALTER TABLE "Doctor" DROP CONSTRAINT "Doctor_clinicId_fkey";
ALTER TABLE "Doctor" DROP COLUMN "clinicId",
DROP COLUMN "isApproved",
DROP COLUMN "rejectedAt",
DROP COLUMN "removedAt",
DROP COLUMN "room",
DROP COLUMN "workStart",
DROP COLUMN "workEnd",
DROP COLUMN "workDays",
DROP COLUMN "daysOff";
