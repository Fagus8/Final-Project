import { z } from "zod";
import { isUuid, jsonError, readJson } from "@/lib/api";
import { activeClinicWhere } from "@/lib/doctors";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// ფოტო ინახება ან ბმულად, ან პატარა data URL-ად (ბრაუზერში წინასწარ დაპატარავებული)
const MAX_PHOTO_LENGTH = 300_000;

const photoSchema = z
  .string()
  .max(MAX_PHOTO_LENGTH, "ფოტო ძალიან დიდია")
  .refine(
    (value) =>
      value === "" ||
      /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ||
      /^https?:\/\/\S+$/.test(value),
    "ფოტოს ფორმატი არასწორია",
  );

// სიის ელემენტები: ცარიელებს ვშლით, დუბლიკატებს ვაშორებთ
const listSchema = z
  .array(z.string().trim().max(60))
  .max(20)
  .transform((items) => [...new Set(items.filter(Boolean))]);

const profileSchema = z.object({
  avatarUrl: photoSchema,
  bio: z.string().trim().max(1500, "„ჩემ შესახებ“ მაქსიმუმ 1500 სიმბოლოა"),
  education: z.string().trim().max(500, "განათლება მაქსიმუმ 500 სიმბოლოა"),
  languages: listSchema,
  services: listSchema,
  consultationFee: z.number().int().min(0).max(10_000).nullable(),
  // ამ ორს მხოლოდ კლინიკა ცვლის (ექიმის გაგზავნილს ვაიგნორებთ)
  experienceYears: z.number().int().min(0).max(80).optional(),
  specialty: z.string().trim().min(1, "სპეციალობა სავალდებულოა").max(80).optional(),
});

// ექიმის პროფილის რედაქტირება — თავად ექიმი ან მისი რომელიმე კლინიკა.
// სპეციალობა და გამოცდილება საჯაროდ ჩანს და კლინიკა აგებს პასუხს, ამიტომ მათ მხოლოდ კლინიკა ცვლის
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

  const result = profileSchema.safeParse(await readJson(request));
  if (!result.success) {
    // პირველივე შეცდომის ტექსტს ვაბრუნებთ, რომ ფორმამ აჩვენოს
    return jsonError(result.error.issues[0]?.message ?? "შეამოწმე შევსებული ველები", 400);
  }

  // მხოლოდ აქტიური კავშირები: უარყოფილ და მოხსნილ კლინიკას ექიმის რედაქტირება აღარ შეუძლია
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: { clinics: { where: activeClinicWhere, select: { clinicId: true, isApproved: true } } },
  });
  if (!doctor) {
    return jsonError("ექიმი ვერ მოიძებნა", 404);
  }

  const isClinic = doctor.clinics.some((item) => item.clinicId === session.user.id);
  // ექიმი პროფილს ერთი კლინიკის დადასტურების შემდეგ მაინც ავსებს
  const isDoctor = doctor.userId === session.user.id && doctor.clinics.some((item) => item.isApproved);

  if (!isClinic && !isDoctor) {
    return jsonError("ამ ექიმის რედაქტირება არ შეგიძლია", 403);
  }

  const data = result.data;

  // ცარიელი ტექსტი ბაზაში null-ად ინახება
  await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      avatarUrl: data.avatarUrl || null,
      bio: data.bio || null,
      education: data.education || null,
      languages: data.languages,
      services: data.services,
      consultationFee: data.consultationFee,
      // undefined ველს Prisma არ ცვლის
      experienceYears: isClinic ? data.experienceYears : undefined,
      specialty: isClinic ? data.specialty : undefined,
    },
  });

  return Response.json({ message: "პროფილი შენახულია" });
}
