import { z } from "zod";
import { jsonError, readJson } from "@/lib/api";
import { visibleDoctorWhere } from "@/lib/doctors";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { generateTimes, isValidDay, isValidTime, isWorkingDay, toDate } from "@/lib/time";

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
    where: { id: doctorId, ...visibleDoctorWhere },
    include: { clinic: { select: { name: true } } },
  });

  if (!doctor) {
    return jsonError("ექიმი ვერ მოიძებნა", 404);
  }

  const startsAt = toDate(date, time);

  // დრო უნდა იყოს ექიმის სამუშაო დღესა და საათებში და მომავალში
  const isWorkingTime =
    isWorkingDay(doctor, date) && generateTimes(doctor.workStart, doctor.workEnd).includes(time);
  if (!isWorkingTime || startsAt.getTime() <= Date.now()) {
    return jsonError("ეს დრო ხელმისაწვდომი არ არის", 400);
  }

  // Serializable ტრანზაქცია: თუ ორი პაციენტი ერთდროულად სცდის ერთი
  // და იგივე დროის დაჯავშნას, მეორე ტრანზაქცია ჩავარდება და ორმაგი ჯავშანი არ შეიქმნება.
  // შედეგი: ახალი ვიზიტის id, ან ვინ არის ამ დროს დაკავებული
  let outcome: { appointmentId: string } | { conflict: "doctor" | "patient" };

  try {
    outcome = await prisma.$transaction(
      async (transaction) => {
        // ექიმს ამ დროს სხვა პაციენტი ხომ არ ჰყავს?
        const doctorBusy = await transaction.appointment.findFirst({
          where: { doctorId, startsAt, status: { not: "CANCELLED" } },
        });

        if (doctorBusy) {
          return { conflict: "doctor" as const };
        }

        // პაციენტს ამ დროს სხვა ექიმთან ხომ არ აქვს ვიზიტი?
        const patientBusy = await transaction.appointment.findFirst({
          where: { patientId: session.user.id, startsAt, status: { not: "CANCELLED" } },
        });

        if (patientBusy) {
          return { conflict: "patient" as const };
        }

        // ექიმის და კლინიკის სახელი ვიზიტშიც ინახება — ისტორიისთვის
        const appointment = await transaction.appointment.create({
          data: {
            doctorId,
            patientId: session.user.id,
            startsAt,
            doctorName: doctor.name,
            doctorSpecialty: doctor.specialty,
            clinicName: doctor.clinic.name,
          },
        });

        return { appointmentId: appointment.id };
      },
      { isolationLevel: "Serializable" },
    );
  } catch {
    // ერთდროულმა ჯავშანმა ტრანზაქცია ჩააგდო — დრო სხვამ დაიკავა
    outcome = { conflict: "doctor" };
  }

  if ("conflict" in outcome) {
    return outcome.conflict === "patient"
      ? jsonError("ამ დროს უკვე გაქვს ვიზიტი სხვა ექიმთან. აირჩიე სხვა დრო.", 409)
      : jsonError("ეს დრო უკვე დაკავებულია. აირჩიე სხვა დრო.", 409);
  }

  return Response.json({ message: "ვიზიტი წარმატებით დაიჯავშნა", appointmentId: outcome.appointmentId });
}
