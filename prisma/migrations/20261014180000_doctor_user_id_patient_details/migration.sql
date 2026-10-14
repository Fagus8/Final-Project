-- ექიმს ანგარიშთან userId აკავშირებს
ALTER TABLE "Doctor" ADD COLUMN "userId" UUID;

-- არსებული ექიმები, რომლებიც აქამდე ელფოსტით იყვნენ მიბმული
UPDATE "Doctor" AS d
SET "userId" = u."id"
FROM "User" AS u
WHERE d."email" = u."email" AND u."accountType" = 'DOCTOR';

CREATE UNIQUE INDEX "Doctor_userId_key" ON "Doctor"("userId");

ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Patient: სახელი User-შია, ასაკი/ბოლო ვიზიტი/ფოტო არ გამოიყენებოდა
ALTER TABLE "Patient" DROP COLUMN "age",
DROP COLUMN "avatarUrl",
DROP COLUMN "lastVisit",
DROP COLUMN "name",
ADD COLUMN "phone" TEXT;
