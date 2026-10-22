import { z } from "zod";
import { isUuid, jsonError, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isValidTime } from "@/lib/slots";

const doctorSchema = z.object({
  workStart: z.string().refine(isValidTime),
  workEnd: z.string().refine(isValidTime),
  // ამ ორს მხოლოდ კლინიკა ცვლის
  email: z.string().trim().toLowerCase().optional(),
  room: z.string().trim().optional(),
});

// ექიმის გრაფიკის, კაბინეტისა და ელფოსტის შეცვლა
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const session = await getSession();

  if (!session) {
    return jsonError("შესვლა საჭიროა", 401);
  }

  const { doctorId } = await params;
  if (!isUuid(doctorId)) {
    return jsonError("ექიმი ვერ მოიძებნა", 404);
  }

  const result = doctorSchema.safeParse(await readJson(request));
  if (!result.success) {
    return jsonError("დრო უნდა იყოს ფორმატით 10:00", 400);
  }

  const { workStart, workEnd, email, room } = result.data;

  // "10:00" < "18:00" — ერთნაირი ფორმატის დროები ტექსტადაც სწორად დარდება
  if (workStart >= workEnd) {
    return jsonError("სამუშაოს დასაწყისი დასრულებაზე ადრე უნდა იყოს", 400);
  }

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    return jsonError("ექიმი ვერ მოიძებნა", 404);
  }

  const isClinic = doctor.clinicId === session.user.id;
  const isDoctor = doctor.userId === session.user.id;

  if (!isClinic && !isDoctor) {
    return jsonError("ამ ექიმის რედაქტირება არ შეგიძლია", 403);
  }

  if (isClinic && email) {
    // ერთი ელფოსტა მხოლოდ ერთ ექიმს შეიძლება ჰქონდეს
    const emailTaken = await prisma.doctor.findFirst({
      where: { email, id: { not: doctorId } },
    });

    if (emailTaken) {
      return jsonError("ეს ელფოსტა სხვა ექიმს უკვე აქვს", 409);
    }
  }

  // საათებს ორივე ცვლის, ელფოსტას და კაბინეტს — მხოლოდ კლინიკა
  if (isClinic) {
    await prisma.doctor.update({
      where: { id: doctorId },
      data: { workStart, workEnd, email: email || null, room: room || null },
    });
  } else {
    await prisma.doctor.update({
      where: { id: doctorId },
      data: { workStart, workEnd },
    });
  }

  return Response.json({ message: "ცვლილებები შენახულია" });
}
