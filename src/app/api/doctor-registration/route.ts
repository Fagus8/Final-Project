import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const doctorSchema = z.object({
  specialty: z.string().trim().min(1),
  experienceYears: z.number().int().min(0),
  clinicId: z.string().uuid(),
});

// ექიმი თვითონ რეგისტრირდება და ირჩევს კლინიკას.
// კლინიკა მას „ახალი ექიმების“ სიაში ნახავს და დაადასტურებს.
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ message: "შესვლა საჭიროა" }, { status: 401 });
  }

  if (session.user.accountType !== "DOCTOR") {
    return Response.json({ message: "ეს მოქმედება მხოლოდ ექიმის ანგარიშისთვისაა" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "მოთხოვნის მონაცემები არასწორია" }, { status: 400 });
  }

  const result = doctorSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ message: "შეამოწმე შევსებული ველები" }, { status: 400 });
  }

  // თუ კლინიკას ეს ექიმი უკვე დამატებული ჰყავს ამ ელფოსტით, ახალს არ ვქმნით
  const existing = await prisma.doctor.findUnique({
    where: { email: session.user.email },
  });

  if (existing) {
    return Response.json({ message: "ანგარიში უკვე დაკავშირებულია ექიმთან" });
  }

  const clinic = await prisma.clinic.findFirst({
    where: { id: result.data.clinicId, isApproved: true },
  });

  if (!clinic) {
    return Response.json({ message: "კლინიკა ვერ მოიძებნა" }, { status: 404 });
  }

  await prisma.doctor.create({
    data: {
      name: session.user.name,
      email: session.user.email,
      specialty: result.data.specialty,
      experienceYears: result.data.experienceYears,
      clinicId: clinic.id,
      isApproved: false,
    },
  });

  await notify(clinic.id, `ახალი ექიმი ითხოვს დადასტურებას: ${session.user.name} (${result.data.specialty})`);

  return Response.json({ message: "მოთხოვნა გაიგზავნა კლინიკასთან" });
}
