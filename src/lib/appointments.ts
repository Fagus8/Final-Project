import { prisma } from "./prisma";
import { formatTime, generateTimes, isSunday, toDate } from "./slots";

type DoctorHours = {
  id: string;
  workStart: string;
  workEnd: string;
};

// აბრუნებს ექიმის თავისუფალ დროებს კონკრეტულ დღეს
export async function getAvailableTimes(doctor: DoctorHours, date: string) {
  if (isSunday(date)) {
    return [];
  }

  const dayStart = toDate(date, "00:00");
  const dayEnd = toDate(date, "23:59");

  // გაუქმებული ვიზიტები დროს არ იკავებს
  const taken = await prisma.appointment.findMany({
    where: {
      doctorId: doctor.id,
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
