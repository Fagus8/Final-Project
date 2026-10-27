-- ექიმს კლინიკა აღარ ამატებს: ექიმი თვითონ რეგისტრირდება, ამიტომ ანგარიში სავალდებულოა.
-- ანგარიშის გარეშე (კლინიკის მოწვეული) ექიმები იშლება
DELETE FROM "Doctor" WHERE "userId" IS NULL;

ALTER TABLE "Doctor" DROP CONSTRAINT "Doctor_userId_fkey";
ALTER TABLE "Doctor" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ელფოსტა User-შია, ექიმის ცალკე ელფოსტა აღარ გვჭირდება
DROP INDEX "Doctor_email_key";
ALTER TABLE "Doctor" DROP COLUMN "email";
