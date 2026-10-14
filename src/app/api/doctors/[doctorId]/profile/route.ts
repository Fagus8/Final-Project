import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  experienceYears: z.number().int().min(0).max(80),
  specialty: z.string().trim().min(1, "სპეციალობა სავალდებულოა").max(80),
});

// ექიმის პროფილის რედაქტირება — თავად ექიმი ან მისი კლინიკა
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

  const result = profileSchema.safeParse(body);
  if (!result.success) {
    return Response.json(
      { message: result.error.issues[0]?.message ?? "შეამოწმე შევსებული ველები" },
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

  const data = result.data;

  await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      avatarUrl: data.avatarUrl || null,
      bio: data.bio || null,
      education: data.education || null,
      languages: data.languages,
      services: data.services,
      consultationFee: data.consultationFee,
      experienceYears: data.experienceYears,
      specialty: data.specialty,
    },
  });

  return Response.json({ message: "პროფილი შენახულია" });
}
