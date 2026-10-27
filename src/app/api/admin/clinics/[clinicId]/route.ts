import { z } from "zod";
import { isUuid, jsonError, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// ადმინი ცვლის კლინიკის მონაცემებს და ექიმების სიას.
// ახალ ექიმს ადმინი არ ამატებს — ექიმი თვითონ რეგისტრირდება

// მოსალოდნელი მონაცემები. სიაში დარჩენილი ექიმი განახლდება, ამოღებული — წაიშლება
const clinicUpdateSchema = z.object({
  name: z.string().trim().min(1),
  city: z.string().trim().min(1),
  address: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  specialty: z.string().trim().min(1),
  imageUrl: z.string().trim(),
  doctors: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string().trim().min(1),
      specialty: z.string().trim().min(1),
      experienceYears: z.number().int().min(0),
    }),
  ),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const session = await getSession();

  if (!session) {
    return jsonError("შესვლა საჭიროა", 401);
  }

  if (session.user.role !== "admin") {
    return jsonError("ადმინის უფლება საჭიროა", 403);
  }

  const { clinicId } = await params;
  if (!isUuid(clinicId)) {
    return jsonError("კლინიკა ვერ მოიძებნა", 404);
  }

  const result = clinicUpdateSchema.safeParse(await readJson(request));
  if (!result.success) {
    return jsonError("შეამოწმე შევსებული ველები", 400);
  }

  const { doctors, imageUrl, ...clinicData } = result.data;

  // ყველაფერი ერთ ტრანზაქციაშია: ან მთლიანად შეინახება, ან არაფერი
  const outcome = await prisma.$transaction(async (transaction) => {
    const clinic = await transaction.clinic.findUnique({
      where: { id: clinicId },
      select: { doctors: { select: { id: true } } },
    });

    if (!clinic) {
      return "not-found";
    }

    // გაგზავნილი id-ები ამ კლინიკის ექიმებს უნდა ეკუთვნოდეს და არ უნდა მეორდებოდეს.
    // თუ არა, ფორმა მოძველებულია (სხვამ უკვე შეცვალა)
    const submittedIds = doctors.map((doctor) => doctor.id);
    const currentIds = clinic.doctors.map((doctor) => doctor.id);
    const hasDuplicates = new Set(submittedIds).size !== submittedIds.length;
    const hasForeignId = submittedIds.some((id) => !currentIds.includes(id));

    if (hasDuplicates || hasForeignId) {
      return "stale";
    }

    await transaction.clinic.update({
      where: { id: clinicId },
      data: { ...clinicData, imageUrl: imageUrl || null },
    });

    // სიიდან ამოღებულ ექიმებს ვშლით
    await transaction.doctor.deleteMany({
      where: { clinicId, id: { notIn: submittedIds } },
    });

    // დანარჩენს ვაახლებთ
    for (const { id, ...doctorData } of doctors) {
      await transaction.doctor.update({ where: { id }, data: doctorData });
    }

    return "updated";
  });

  if (outcome === "not-found") {
    return jsonError("კლინიკა ვერ მოიძებნა", 404);
  }

  if (outcome === "stale") {
    return jsonError("კლინიკის ექიმების სია შეიცვალა. განაახლე გვერდი და სცადე ხელახლა.", 409);
  }

  return Response.json({ message: "კლინიკის მონაცემები განახლებულია" });
}
