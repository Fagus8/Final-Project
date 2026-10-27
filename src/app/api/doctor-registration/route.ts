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

  const clinic = await prisma.clinic.findFirst({
    where: { id: result.data.clinicId, isApproved: true },
  });

  if (!clinic) {
    return jsonError("კლინიკა ვერ მოიძებნა", 404);
  }

  // მოთხოვნა = დაუდასტურებელი ექიმი; კლინიკა მას „კლინიკის მართვაში“ დაადასტურებს
  const doctorData = {
    name: session.user.name,
    specialty: result.data.specialty,
    experienceYears: result.data.experienceYears,
    clinicId: clinic.id,
    isApproved: false,
  };

  // ერთ ანგარიშს მხოლოდ ერთი ექიმის ჩანაწერი აქვს
  const existing = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
  });

  if (!existing) {
    await prisma.doctor.create({ data: { ...doctorData, userId: session.user.id } });
    return Response.json({ message: "მოთხოვნა გაიგზავნა კლინიკასთან" });
  }

  // აქტიური მოთხოვნა ან კლინიკა უკვე აქვს
  if (!existing.rejectedAt && !existing.removedAt) {
    return jsonError("მოთხოვნა უკვე გაგზავნილია. ჯერ დაელოდე კლინიკის პასუხს.", 409);
  }

  // უარყოფილი ან მოხსნილი ექიმი ახალ კლინიკას ირჩევს. ძველ ვიზიტებს ამ
  // ჩანაწერს ვწყვეტთ, რომ ახალ კლინიკაში არ გადაყვეს — პაციენტების ისტორიაში
  // ისინი რჩება (ექიმის და კლინიკის სახელი ვიზიტშივე ინახება)
  await prisma.$transaction([
    prisma.appointment.updateMany({ where: { doctorId: existing.id }, data: { doctorId: null } }),
    prisma.doctor.update({
      where: { id: existing.id },
      data: { ...doctorData, rejectedAt: null, removedAt: null, room: null, daysOff: [] },
    }),
  ]);

  return Response.json({ message: "მოთხოვნა გაიგზავნა კლინიკასთან" });
}
