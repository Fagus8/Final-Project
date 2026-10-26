import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// საჯაროდ ჩანს (და ჯავშანს იღებს) მხოლოდ ექიმი, რომელიც:
// - კლინიკამ დაადასტურა,
// - საკუთარი ანგარიშით არის დარეგისტრირებული (დიაგნოზს მხოლოდ ექიმი წერს),
// - დამტკიცებულ კლინიკაშია.
// კლინიკის დამატებული (მოწვეული) ექიმი რეგისტრაციამდე მხოლოდ კლინიკასა და ადმინს უჩანს
export const visibleDoctorWhere = {
  isApproved: true,
  userId: { not: null },
  clinic: { isApproved: true },
} satisfies Prisma.DoctorWhereInput;

// მოწვევა = კლინიკის დამატებული ექიმი ამ ელფოსტით, რომელსაც ანგარიში ჯერ არ აქვს.
// ელფოსტა უნიკალურია, ამიტომ მოწვევა მაქსიმუმ ერთი კლინიკიდანაა
export function findDoctorInvitation(email: string) {
  return prisma.doctor.findFirst({
    where: { email: email.trim().toLowerCase(), userId: null },
    select: {
      clinicId: true,
      specialty: true,
      experienceYears: true,
      clinic: { select: { name: true } },
    },
  });
}
