import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ message: "შესვლა საჭიროა" }, { status: 401 });
  }

  const { doctorId } = await params;
  if (!z.string().uuid().safeParse(doctorId).success) {
    return Response.json({ message: "ექიმი ვერ მოიძებნა" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "მოთხოვნის მონაცემები არასწორია" }, { status: 400 });
  }

  const result = doctorSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ message: "დრო უნდა იყოს ფორმატით 10:00" }, { status: 400 });
  }

  const { workStart, workEnd, email, room } = result.data;

  if (workStart >= workEnd) {
    return Response.json(
      { message: "სამუშაოს დასაწყისი დასრულებაზე ადრე უნდა იყოს" },
      { status: 400 },
    );
  }

  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor) {
    return Response.json({ message: "ექიმი ვერ მოიძებნა" }, { status: 404 });
  }

  const isClinic = doctor.clinicId === session.user.id;
  const isDoctor = doctor.userId === session.user.id;

  if (!isClinic && !isDoctor) {
    return Response.json({ message: "ამ ექიმის რედაქტირება არ შეგიძლია" }, { status: 403 });
  }

  if (isClinic && email) {
    // ერთი ელფოსტა მხოლოდ ერთ ექიმს შეიძლება ჰქონდეს
    const emailTaken = await prisma.doctor.findFirst({
      where: { email, id: { not: doctorId } },
    });

    if (emailTaken) {
      return Response.json({ message: "ეს ელფოსტა სხვა ექიმს უკვე აქვს" }, { status: 409 });
    }
  }

  await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      workStart,
      workEnd,
      ...(isClinic ? { email: email || null, room: room || null } : {}),
    },
  });

  return Response.json({ message: "ცვლილებები შენახულია" });
}
