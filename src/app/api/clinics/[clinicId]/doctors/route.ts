import { z } from "zod";
import { checkDoctorEmails, doctorEmailSchema, isUuid, jsonError, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const doctorSchema = z.object({
  name: z.string().trim().min(1, "ექიმის სახელი სავალდებულოა").max(80),
  specialty: z.string().trim().min(1, "სპეციალობა სავალდებულოა").max(80),
  experienceYears: z.number().int().min(0, "გამოცდილების წელი უნდა იყოს 0 ან მეტი").max(80),
  email: doctorEmailSchema,
});

// კლინიკა ამატებს ახალ (მოწვეულ) ექიმს. ექიმი საიტზე გამოჩნდება, როცა ამ
// ელფოსტით დარეგისტრირდება და კლინიკა მის მოთხოვნას დაადასტურებს
export async function POST(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const session = await getSession();

  if (!session) {
    return jsonError("შესვლა საჭიროა", 401);
  }

  const { clinicId } = await params;
  if (!isUuid(clinicId)) {
    return jsonError("კლინიკა ვერ მოიძებნა", 404);
  }

  if (session.user.accountType !== "CLINIC" || session.user.id !== clinicId) {
    return jsonError("ამ კლინიკაში ექიმის დამატება არ შეგიძლია", 403);
  }

  const result = doctorSchema.safeParse(await readJson(request));
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "შეამოწმე შევსებული ველები", 400);
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { isApproved: true },
  });

  if (!clinic) {
    return jsonError("კლინიკა ვერ მოიძებნა", 404);
  }

  const emailError = await checkDoctorEmails([result.data.email]);
  if (emailError) return emailError;

  // დამტკიცებულ კლინიკაში ექიმი მაშინვე დადასტურებულია (როგორც ადმინის დამატებისას);
  // საჯაროდ მაინც არ ჩანს, სანამ ანგარიში არ მიებმება
  await prisma.doctor.create({
    data: { ...result.data, clinicId, isApproved: clinic.isApproved },
  });

  return Response.json({ message: "ექიმი დაემატა. საიტზე გამოჩნდება მისი რეგისტრაციის შემდეგ." });
}
