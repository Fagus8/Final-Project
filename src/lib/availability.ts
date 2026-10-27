import { prisma } from "./prisma";
import { formatTime, generateTimes, isWorkingDay, toDate } from "./time";

type DoctorHours = {
  id: string;
  workStart: string;
  workEnd: string;
  workDays: number[];
  daysOff: string[];
};

// აბრუნებს ექიმის თავისუფალ დროებს კონკრეტულ დღეს.
// patientId — თუ პაციენტი შესულია, მისი სხვა ვიზიტების დროებიც ითიშება
export async function getAvailableTimes(doctor: DoctorHours, date: string, patientId?: string) {
  if (!isWorkingDay(doctor, date)) {
    return [];
  }

  const dayStart = toDate(date, "00:00");
  const dayEnd = toDate(date, "23:59");

  // გაუქმებული ვიზიტები დროს არ იკავებს
  const taken = await prisma.appointment.findMany({
    where: {
      OR: patientId ? [{ doctorId: doctor.id }, { patientId }] : [{ doctorId: doctor.id }],
      status: { not: "CANCELLED" },
      startsAt: { gte: dayStart, lte: dayEnd },
    },
    select: { startsAt: true },
  });
  const takenTimes = taken.map((appointment) => formatTime(appointment.startsAt));

  // წარსული დროის დაჯავშნა არ შეიძლება
  const now = Date.now();

  return generateTimes(doctor.workStart, doctor.workEnd).filter(
    (time) => !takenTimes.includes(time) && toDate(date, time).getTime() > now,
  );
}
