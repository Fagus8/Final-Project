import { z } from "zod";
import { jsonError, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// კლინიკის რეგისტრაციის მეორე ნაბიჯი: ანგარიში უკვე შექმნილია,
// აქ ვინახავთ კლინიკის მონაცემებს (ადმინის დამტკიცებამდე დამალულია).
// ექიმები კლინიკას დამტკიცების შემდეგ თვითონ ირჩევენ

const clinicSchema = z.object({
  name: z.string().trim().min(1),
  city: z.string().trim().min(1),
  address: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  specialty: z.string().trim().min(1),
  imageUrl: z.string().trim(),
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

  const { imageUrl, ...clinicData } = result.data;

  // კლინიკის id = ანგარიშის id. upsert-ის update ცარიელია: თუ კლინიკა
  // უკვე არსებობს (ფორმა ორჯერ გაიგზავნა), არაფერი იცვლება
  const clinic = await prisma.clinic.upsert({
    where: { id: session.user.id },
    create: {
      id: session.user.id,
      ...clinicData,
      imageUrl: imageUrl || null,
      isApproved: false,
    },
    update: {},
    select: { id: true },
  });

  return Response.json({
    message: "კლინიკა გაიგზავნა დასამტკიცებლად",
    clinicId: clinic.id,
  });
}
