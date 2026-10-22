import { z } from "zod";
import { jsonError, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateTimes, isSunday, isValidDay, isValidTime, toDate } from "@/lib/slots";

const bookingSchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string(),
  time: z.string(),
});

// პაციენტი ჯავშნის ვიზიტს
export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return jsonError("შესვლა საჭიროა", 401);
  }

  if (session.user.accountType !== "PATIENT") {
    return jsonError("ვიზიტის დაჯავშნა მხოლოდ პაციენტს შეუძლია", 403);
  }

  const result = bookingSchema.safeParse(await readJson(request));
  if (!result.success || !isValidDay(result.data.date) || !isValidTime(result.data.time)) {
    return jsonError("შეამოწმე თარიღი და დრო", 400);
  }

  const { doctorId, date, time } = result.data;

  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, isApproved: true },
  });

  if (!doctor) {
    return jsonError("ექიმი ვერ მოიძებნა", 404);
  }

  const startsAt = toDate(date, time);

  // დრო უნდა იყოს ექიმის სამუშაო საათებში და მომავალში
  const isWorkingTime = !isSunday(date) && generateTimes(doctor.workStart, doctor.workEnd).includes(time);
  if (!isWorkingTime || startsAt.getTime() <= Date.now()) {
    return jsonError("ეს დრო ხელმისაწვდომი არ არის", 400);
  }

  // Serializable ტრანზაქცია: თუ ორი პაციენტი ერთდროულად სცდის ერთი
  // და იგივე დროის დაჯავშნას, მეორე ტრანზაქცია ჩავარდება და ორმაგი ჯავშანი არ შეიქმნება.
  let appointmentId: string | null = null;

  try {
    appointmentId = await prisma.$transaction(
      async (transaction) => {
        // ექიმს ამ დროს სხვა პაციენტი ხომ არ ჰყავს?
        const doctorBusy = await transaction.appointment.findFirst({
          where: { doctorId, startsAt, status: { not: "CANCELLED" } },
        });

        // პაციენტს ამ დროს სხვა ექიმთან ხომ არ აქვს ვიზიტი?
        const patientBusy = await transaction.appointment.findFirst({
          where: { patientId: session.user.id, startsAt, status: { not: "CANCELLED" } },
        });

        if (doctorBusy || patientBusy) {
          return null;
        }

        const appointment = await transaction.appointment.create({
          data: { doctorId, patientId: session.user.id, startsAt },
        });

        return appointment.id;
      },
      { isolationLevel: "Serializable" },
    );
  } catch {
    appointmentId = null;
  }

  if (!appointmentId) {
    return jsonError("ეს დრო უკვე დაკავებულია. აირჩიე სხვა დრო.", 409);
  }

  return Response.json({ message: "ვიზიტი წარმატებით დაიჯავშნა", appointmentId });
}
