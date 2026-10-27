import type { Prisma } from "@/generated/prisma/client";

// საჯაროდ ჩანს (და ჯავშანს იღებს) მხოლოდ ექიმი, რომელიც:
// - კლინიკამ დაადასტურა,
// - დამტკიცებულ კლინიკაშია.
export const visibleDoctorWhere = {
  isApproved: true,
  clinic: { isApproved: true },
} satisfies Prisma.DoctorWhereInput;

// კლინიკის ექიმები: დადასტურებულები და მოლოდინში მყოფები,
// უარყოფილი და მოხსნილი ექიმების გარეშე
export const activeDoctorWhere = {
  rejectedAt: null,
  removedAt: null,
} satisfies Prisma.DoctorWhereInput;

// ექიმის კლინიკიდან მოხსნა (კლინიკა ან ადმინი). მომავალი ვიზიტები უქმდება
// მიზეზით, წარსული ვიზიტები და დიაგნოზები კი ისტორიაში რჩება.
// ჩანაწერი არ იშლება: ექიმი ნახავს, რომ მოხსნეს, და სხვა კლინიკას აირჩევს
export async function removeDoctors(
  transaction: Prisma.TransactionClient,
  doctorIds: string[],
  cancelledBy: "CLINIC" | "ADMIN",
  reason: string,
) {
  if (doctorIds.length === 0) {
    return;
  }

  await transaction.appointment.updateMany({
    where: { doctorId: { in: doctorIds }, status: "BOOKED", startsAt: { gt: new Date() } },
    data: { status: "CANCELLED", cancelledBy, cancelReason: reason },
  });

  await transaction.doctor.updateMany({
    where: { id: { in: doctorIds } },
    data: { isApproved: false, removedAt: new Date() },
  });
}
