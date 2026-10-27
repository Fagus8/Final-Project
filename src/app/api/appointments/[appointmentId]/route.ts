import { z } from "zod";
import { isUuid, jsonError, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// ორი მოქმედება: გაუქმება (არასავალდებულო მიზეზით) და დასრულება (დიაგნოზით)
const actionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("cancel"),
    reason: z.string().trim().max(300, "მიზეზი მაქსიმუმ 300 სიმბოლოა").optional(),
  }),
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
    return jsonError(result.error.issues[0]?.message ?? "შეამოწმე შევსებული ველები", 400);
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: true },
  });

  if (!appointment) {
    return jsonError("ვიზიტი ვერ მოიძებნა", 404);
  }

  // ვინ არის მომხმარებელი ამ ვიზიტთან მიმართებით.
  // ექიმის ჩანაწერი შეიძლება აღარ არსებობდეს (კლინიკა წაიშალა) — მაშინ doctor null-ია
  const user = session.user;
  const isPatient = appointment.patientId === user.id;
  const isClinic = appointment.doctor !== null && appointment.doctor.clinicId === user.id;
  // კლინიკიდან მოხსნილი ექიმი ძველ ვიზიტებს ვეღარ ცვლის
  const isDoctor =
    appointment.doctor !== null && appointment.doctor.userId === user.id && appointment.doctor.isApproved;
  const isAdmin = user.role === "admin";

  const data = result.data;
  const hasStarted = appointment.startsAt.getTime() <= Date.now();

  // ---- გაუქმება: პაციენტი, კლინიკა ან ადმინი. ექიმი ვიზიტს ვერ აუქმებს ----
  if (data.action === "cancel") {
    if (!isPatient && !isClinic && !isAdmin) {
      return jsonError(
        isDoctor ? "ექიმს ვიზიტის გაუქმება არ შეუძლია — მიმართე კლინიკას" : "ამ ვიზიტის გაუქმება არ შეგიძლია",
        403,
      );
    }

    if (appointment.status !== "BOOKED") {
      return jsonError("გაუქმება მხოლოდ აქტიურ ვიზიტს შეიძლება", 400);
    }

    // პაციენტი გასულ ვიზიტს ვეღარ აუქმებს. კლინიკას შეუძლია — მაგ: პაციენტი არ გამოცხადდა
    if (hasStarted && !isClinic && !isAdmin) {
      return jsonError("გასული ვიზიტის გაუქმება შეუძლებელია", 400);
    }

    const cancelledBy = isClinic ? "CLINIC" : isPatient ? "PATIENT" : "ADMIN";

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED", cancelledBy, cancelReason: data.reason || null },
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

  if (!hasStarted) {
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
