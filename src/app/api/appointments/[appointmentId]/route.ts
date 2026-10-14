import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getDoctorUserId, notify } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/slots";

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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ message: "შესვლა საჭიროა" }, { status: 401 });
  }

  const { appointmentId } = await params;
  if (!z.string().uuid().safeParse(appointmentId).success) {
    return Response.json({ message: "ვიზიტი ვერ მოიძებნა" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "მოთხოვნის მონაცემები არასწორია" }, { status: 400 });
  }

  const result = actionSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ message: "შეამოწმე შევსებული ველები" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: true, patient: true },
  });

  if (!appointment) {
    return Response.json({ message: "ვიზიტი ვერ მოიძებნა" }, { status: 404 });
  }

  // ვინ არის მომხმარებელი ამ ვიზიტთან მიმართებით
  const user = session.user;
  const isPatient = appointment.patientId === user.id;
  const isClinic = appointment.doctor.clinicId === user.id;
  const isDoctor = user.accountType === "DOCTOR" && appointment.doctor.email === user.email;
  const isAdmin = user.role === "admin";

  const when = formatDateTime(appointment.startsAt);
  const data = result.data;

  if (data.action === "cancel") {
    if (!isPatient && !isClinic && !isDoctor && !isAdmin) {
      return Response.json({ message: "ამ ვიზიტის გაუქმება არ შეგიძლია" }, { status: 403 });
    }

    if (appointment.status !== "BOOKED") {
      return Response.json({ message: "გაუქმება მხოლოდ აქტიურ ვიზიტს შეიძლება" }, { status: 400 });
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CANCELLED" },
    });

    // ყველას ვატყობინებთ, ვინც თვითონ არ გააუქმა
    const message = `ვიზიტი გაუქმდა: ${appointment.patient.name} → ${appointment.doctor.name}, ${when}`;
    if (!isPatient) await notify(appointment.patientId, message);
    if (!isClinic) await notify(appointment.doctor.clinicId, message);
    if (!isDoctor) await notify(await getDoctorUserId(appointment.doctor.email), message);

    return Response.json({ message: "ვიზიტი გაუქმდა" });
  }

  // დასრულება: ექიმი წერს დიაგნოზს და დანიშნულებას
  if (!isDoctor) {
    return Response.json({ message: "დიაგნოზის ჩაწერა მხოლოდ ექიმს შეუძლია" }, { status: 403 });
  }

  if (appointment.status === "CANCELLED") {
    return Response.json({ message: "გაუქმებულ ვიზიტს დიაგნოზი არ ეწერება" }, { status: 400 });
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "COMPLETED",
      diagnosis: data.diagnosis,
      prescription: data.prescription || null,
    },
  });

  await notify(
    appointment.patientId,
    `ექიმმა ${appointment.doctor.name} ჩაწერა დიაგნოზი და დანიშნულება (${when})`,
  );

  return Response.json({ message: "დიაგნოზი შენახულია" });
}
