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

  // ერთ ანგარიშს მხოლოდ ერთი ექიმის ჩანაწერი აქვს
  const existing = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
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

  // ელფოსტას აქ არ ვწერთ: ის შეიძლება კლინიკის მოწვეულ ექიმს ეკუთვნოდეს.
  // ანგარიში ექიმს მხოლოდ კლინიკის დადასტურების შემდეგ მიებმება (approve)
  await prisma.doctor.create({
    data: {
      name: session.user.name,
      userId: session.user.id,
      specialty: result.data.specialty,
      experienceYears: result.data.experienceYears,
      clinicId: clinic.id,
      isApproved: false,
    },
  });

  await notify(clinic.id, `ახალი ექიმი ითხოვს დადასტურებას: ${session.user.name} (${result.data.specialty})`);

  return Response.json({ message: "მოთხოვნა გაიგზავნა კლინიკასთან" });
}
