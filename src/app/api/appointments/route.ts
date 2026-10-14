import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { formatDateTime, generateTimes, isSunday, isValidDay, isValidTime, toDate } from "@/lib/slots";

const bookingSchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string(),
  time: z.string(),
});

// პაციენტი ჯავშნის ვიზიტს
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ message: "შესვლა საჭიროა" }, { status: 401 });
  }

  if (session.user.accountType !== "PATIENT") {
    return Response.json({ message: "ვიზიტის დაჯავშნა მხოლოდ პაციენტს შეუძლია" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "მოთხოვნის მონაცემები არასწორია" }, { status: 400 });
  }

  const result = bookingSchema.safeParse(body);
  if (!result.success || !isValidDay(result.data.date) || !isValidTime(result.data.time)) {
    return Response.json({ message: "შეამოწმე თარიღი და დრო" }, { status: 400 });
  }

  const { doctorId, date, time } = result.data;

  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, isApproved: true },
    include: { clinic: true },
  });

  if (!doctor) {
    return Response.json({ message: "ექიმი ვერ მოიძებნა" }, { status: 404 });
  }

  const startsAt = toDate(date, time);

  // დრო უნდა იყოს ექიმის სამუშაო საათებში და მომავალში
  if (
    isSunday(date) ||
    !generateTimes(doctor.workStart, doctor.workEnd).includes(time) ||
    startsAt.getTime() <= Date.now()
  ) {
    return Response.json({ message: "ეს დრო ხელმისაწვდომი არ არის" }, { status: 400 });
  }

  // Serializable ტრანზაქცია: თუ ორი პაციენტი ერთდროულად სცდის ერთი
  // და იგივე დროის დაჯავშნას, მეორე ტრანზაქცია ჩავარდება და ორმაგი ჯავშანი არ შეიქმნება.
  let appointmentId: string | null = null;

  try {
    appointmentId = await prisma.$transaction(
      async (transaction) => {
        const doctorBusy = await transaction.appointment.findFirst({
          where: { doctorId, startsAt, status: { not: "CANCELLED" } },
        });

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
    return Response.json(
      { message: "ეს დრო უკვე დაკავებულია. აირჩიე სხვა დრო." },
      { status: 409 },
    );
  }

  const when = formatDateTime(startsAt);
  await notify(session.user.id, `ვიზიტი დაიჯავშნა: ${doctor.name}, ${when}`);
  await notify(doctor.clinicId, `ახალი ჯავშანი: ${session.user.name} → ${doctor.name}, ${when}`);
  await notify(doctor.userId, `ახალი პაციენტი: ${session.user.name}, ${when}`);

  return Response.json({ message: "ვიზიტი წარმატებით დაიჯავშნა", appointmentId });
}
