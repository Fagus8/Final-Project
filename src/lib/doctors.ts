import type { Prisma } from "@/generated/prisma/client";

// საჯაროდ ჩანს (და ჯავშანს იღებს) მხოლოდ ექიმი, რომელიც:
// - კლინიკამ დაადასტურა,
// - დამტკიცებულ კლინიკაშია.
export const visibleDoctorWhere = {
  isApproved: true,
  clinic: { isApproved: true },
} satisfies Prisma.DoctorWhereInput;
