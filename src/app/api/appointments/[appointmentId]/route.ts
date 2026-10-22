import { z } from "zod";
import { isUuid, jsonError, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// ორი მოქმედება: გაუქმება და დასრულება (დიაგნოზით)
const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel") }),
  z.object({
    action: z.literal("complete"),
    diagnosis: z.string().trim().min(1),
    prescription: z.string().trim(),
  }),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  const session = await getSession();

  if (!session) {
    return jsonError("შესვლა საჭიროა", 401);
  }

  const { appointmentId } = await params;
  if (!isUuid(appointmentId)) {
    return jsonError("ვიზიტი ვერ მოიძებნა", 404);
  }

  const result = actionSchema.safeParse(await readJson(request));
  if (!result.success) {
    return jsonError("შეამოწმე შევსებული ველები", 400);
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: true },
  });

  if (!appointment) {
    return jsonError("ვიზიტი ვერ მოიძებნა", 404);
  }

  // ვინ არის მომხმარებელი ამ ვიზიტთან მიმართებით
  const user = session.user;
  const isPatient = appointment.patientId === user.id;
  const isClinic = appointment.doctor.clinicId === user.id;
  const isDoctor = appointment.doctor.userId === user.id;
  const isAdmin = user.role === "admin";

  const data = result.data;

  // ---- გაუქმება ----
  if (data.action === "cancel") {
    if (!isPatient && !isClinic && !isDoctor && !isAdmin) {
      return jsonError("ამ ვიზიტის გაუქმება არ შეგიძლია", 403);
    }

    if (appointment.status !== "BOOKED") {
      return jsonError("გაუქმება მხოლოდ აქტიურ ვიზიტს შეიძლება", 400);
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" },
    });

    return Response.json({ message: "ვიზიტი გაუქმდა" });
  }

  // ---- დასრულება: ექიმი წერს დიაგნოზს და დანიშნულებას ----
  if (!isDoctor) {
    return jsonError("დიაგნოზის ჩაწერა მხოლოდ ექიმს შეუძლია", 403);
  }

  if (appointment.status === "CANCELLED") {
    return jsonError("გაუქმებულ ვიზიტს დიაგნოზი არ ეწერება", 400);
  }

  if (appointment.startsAt.getTime() > Date.now()) {
    return jsonError("ვიზიტის დრო ჯერ არ დამდგარა", 400);
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "COMPLETED",
      diagnosis: data.diagnosis,
      prescription: data.prescription || null,
    },
  });

  return Response.json({ message: "დიაგნოზი შენახულია" });
}
