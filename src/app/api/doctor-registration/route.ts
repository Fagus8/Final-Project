import { z } from "zod";
import { jsonError, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const doctorSchema = z.object({
  specialty: z.string().trim().min(1),
  experienceYears: z.number().int().min(0),
  clinicId: z.string().uuid(),
});

// ექიმი თვითონ რეგისტრირდება და ირჩევს კლინიკას.
// კლინიკა მას „ახალი ექიმების“ სიაში ნახავს და დაადასტურებს.
export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return jsonError("შესვლა საჭიროა", 401);
  }

  if (session.user.accountType !== "DOCTOR") {
    return jsonError("ეს მოქმედება მხოლოდ ექიმის ანგარიშისთვისაა", 403);
  }

  const result = doctorSchema.safeParse(await readJson(request));
  if (!result.success) {
    return jsonError("შეამოწმე შევსებული ველები", 400);
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
    return jsonError("კლინიკა ვერ მოიძებნა", 404);
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

  return Response.json({ message: "მოთხოვნა გაიგზავნა კლინიკასთან" });
}
