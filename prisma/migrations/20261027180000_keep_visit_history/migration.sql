-- ექიმის სამუშაო დღეები, დასვენების დღეები, უარყოფილი მოთხოვნა და კლინიკიდან მოხსნა
ALTER TABLE "Doctor" ADD COLUMN "workDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6]::INTEGER[],
ADD COLUMN "daysOff" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "rejectedAt" TIMESTAMP(3),
ADD COLUMN "removedAt" TIMESTAMP(3);

-- ვიზიტი ინახავს ექიმისა და კლინიკის სახელს, ვინ გააუქმა და რატომ
ALTER TABLE "Appointment" ADD COLUMN "cancelledBy" TEXT,
ADD COLUMN "cancelReason" TEXT,
ADD COLUMN "doctorName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "doctorSpecialty" TEXT NOT NULL DEFAULT '',
ADD COLUMN "clinicName" TEXT NOT NULL DEFAULT '';

-- არსებულ ვიზიტებს სახელებს ექიმიდან და კლინიკიდან ვუწერთ
UPDATE "Appointment" AS a
SET "doctorName" = d."name", "doctorSpecialty" = d."specialty", "clinicName" = c."name"
FROM "Doctor" AS d
JOIN "Clinic" AS c ON c."id" = d."clinicId"
WHERE d."id" = a."doctorId";

ALTER TABLE "Appointment" ALTER COLUMN "doctorName" DROP DEFAULT,
ALTER COLUMN "doctorSpecialty" DROP DEFAULT,
ALTER COLUMN "clinicName" DROP DEFAULT;

-- ექიმის წაშლისას ვიზიტი აღარ იშლება (SET NULL)
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_doctorId_fkey";
ALTER TABLE "Appointment" ALTER COLUMN "doctorId" DROP NOT NULL;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
