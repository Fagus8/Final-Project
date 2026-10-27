import { z } from "zod";
import { isUuid, jsonError, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isValidTime } from "@/lib/time";

const doctorSchema = z.object({
  workStart: z.string().refine(isValidTime, "დრო უნდა იყოს ფორმატით 10:00"),
  workEnd: z.string().refine(isValidTime, "დრო უნდა იყოს ფორმატით 10:00"),
  // კაბინეტს მხოლოდ კლინიკა ცვლის
  room: z.string().trim().optional(),
});

// ექიმის გრაფიკისა და კაბინეტის შეცვლა
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
    return jsonError(result.error.issues[0]?.message ?? "შეამოწმე შევსებული ველები", 400);
  }

  const { workStart, workEnd, room } = result.data;

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

  // საათებს ორივე ცვლის, კაბინეტს — მხოლოდ კლინიკა
  if (isClinic) {
    await prisma.doctor.update({
      where: { id: doctorId },
      data: { workStart, workEnd, room: room || null },
    });
  } else {
    await prisma.doctor.update({
      where: { id: doctorId },
      data: { workStart, workEnd },
    });
  }

  return Response.json({ message: "ცვლილებები შენახულია" });
}
