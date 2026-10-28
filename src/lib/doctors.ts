import type { Prisma } from "@/generated/prisma/client";

// ექიმი რამდენიმე კლინიკაში შეიძლება მუშაობდეს (DoctorClinic — კავშირი კლინიკასთან).
// კავშირი „ხილულია“ (ამ კლინიკაში ჯავშანს იღებს), თუ:
// - კლინიკამ ექიმი დაადასტურა,
// - კლინიკა ადმინს დამტკიცებული აქვს.
export const visibleClinicWhere = {
  isApproved: true,
  clinic: { isApproved: true },
} satisfies Prisma.DoctorClinicWhereInput;

// საჯაროდ ჩანს ექიმი, რომელსაც ერთი ხილული კლინიკა მაინც აქვს
export const visibleDoctorWhere = {
  clinics: { some: visibleClinicWhere },
} satisfies Prisma.DoctorWhereInput;

// ექიმის ხილული კლინიკები სახელებით — სიებში და ბარათებზე საჩვენებლად
export const visibleClinicsInclude = {
  where: visibleClinicWhere,
  select: { clinic: { select: { id: true, name: true } } },
  orderBy: { clinic: { name: "asc" } },
} satisfies Prisma.Doctor$clinicsArgs;

// ["ა", "ბ"] -> "ა, ბ"
export function clinicNames(doctor: { clinics: { clinic: { name: string } }[] }) {
  return doctor.clinics.map((item) => item.clinic.name).join(", ");
}

// აქტიური კავშირი: დადასტურებული ან მოლოდინში, უარყოფილისა და მოხსნილის გარეშე
export const activeClinicWhere = {
  rejectedAt: null,
  removedAt: null,
} satisfies Prisma.DoctorClinicWhereInput;

// ექიმების მოხსნა ერთი კლინიკიდან (კლინიკა ან ადმინი). ამ კლინიკაში მათი მომავალი
// ვიზიტები უქმდება მიზეზით, წარსული ვიზიტები და დიაგნოზები კი ისტორიაში რჩება.
// სხვა კლინიკებში ექიმი ისევ მუშაობს. ჩანაწერი არ იშლება: ექიმი ნახავს, რომ მოხსნეს
export async function removeDoctorsFromClinic(
  transaction: Prisma.TransactionClient,
  clinicId: string,
  doctorIds: string[],
  cancelledBy: "CLINIC" | "ADMIN",
  reason: string,
) {
  if (doctorIds.length === 0) {
    return;
  }

  await transaction.appointment.updateMany({
    where: {
      doctorId: { in: doctorIds },
      clinicId,
      status: "BOOKED",
      startsAt: { gt: new Date() },
    },
    data: { status: "CANCELLED", cancelledBy, cancelReason: reason },
  });

  await transaction.doctorClinic.updateMany({
    where: { clinicId, doctorId: { in: doctorIds } },
    data: { isApproved: false, removedAt: new Date() },
  });
}
