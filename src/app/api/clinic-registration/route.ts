import { z } from "zod";
import { checkDoctorEmails, doctorEmailSchema, jsonError, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// კლინიკის რეგისტრაციის მეორე ნაბიჯი: ანგარიში უკვე შექმნილია,
// აქ ვინახავთ კლინიკის მონაცემებს და ექიმებს (ადმინის დამტკიცებამდე დამალულია)

const clinicSchema = z.object({
  name: z.string().trim().min(1),
  city: z.string().trim().min(1),
  address: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  specialty: z.string().trim().min(1),
  imageUrl: z.string().trim(),
  doctors: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        specialty: z.string().trim().min(1),
        experienceYears: z.number().int().min(0),
        email: doctorEmailSchema,
      }),
    )
    .min(1),
});

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return jsonError("შესასვლელი ხარ ანგარიშში", 401);
  }

  if (session.user.accountType !== "CLINIC") {
    return jsonError("ეს მოქმედება მხოლოდ კლინიკის ანგარიშისთვისაა", 403);
  }

  const result = clinicSchema.safeParse(await readJson(request));
  if (!result.success) {
    return jsonError("შეამოწმე შევსებული ველები", 400);
  }

  const { doctors, imageUrl, ...clinicData } = result.data;

  // თუ კლინიკა უკვე შენახულია (ფორმა ორჯერ გაიგზავნა), ელფოსტებს აღარ ვამოწმებთ —
  // მისივე ექიმები „დაკავებულად“ არ უნდა ჩაითვალოს
  const existing = await prisma.clinic.findUnique({ where: { id: session.user.id }, select: { id: true } });
  if (!existing) {
    const emailError = await checkDoctorEmails(doctors.map((doctor) => doctor.email));
    if (emailError) return emailError;
  }

  // კლინიკის id = ანგარიშის id. upsert-ის update ცარიელია: თუ კლინიკა
  // უკვე არსებობს (ფორმა ორჯერ გაიგზავნა), არაფერი იცვლება
  const clinic = await prisma.clinic.upsert({
    where: { id: session.user.id },
    create: {
      id: session.user.id,
      ...clinicData,
      imageUrl: imageUrl || null,
      isApproved: false,
      doctors: {
        create: doctors.map((doctor) => ({ ...doctor, isApproved: false })),
      },
    },
    update: {},
    select: { id: true },
  });

  return Response.json({
    message: "კლინიკა და ექიმები გაიგზავნა დასამტკიცებლად",
    clinicId: clinic.id,
  });
}
