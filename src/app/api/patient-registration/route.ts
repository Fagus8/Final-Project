import { z } from "zod";
import { jsonError, readJson } from "@/lib/api";
import { BLOOD_TYPES } from "@/lib/blood-types";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const patientSchema = z.object({
  phone: z.string().trim().min(1).max(30),
  // "" — პაციენტმა სისხლის ჯგუფი ჯერ არ იცის
  bloodType: z.union([z.enum(BLOOD_TYPES), z.literal("")]),
});

// პაციენტის დამატებითი მონაცემები: ტელეფონი და სისხლის ჯგუფი
export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return jsonError("შესვლა საჭიროა", 401);
  }

  if (session.user.accountType !== "PATIENT") {
    return jsonError("ეს მოქმედება მხოლოდ პაციენტისთვისაა", 403);
  }

  const result = patientSchema.safeParse(await readJson(request));
  if (!result.success) {
    return jsonError("შეამოწმე შევსებული ველები", 400);
  }

  const data = { phone: result.data.phone, bloodType: result.data.bloodType || null };

  // თუ ჩანაწერი უკვე არსებობს, ვაახლებთ; თუ არა — ვქმნით
  await prisma.patient.upsert({
    where: { id: session.user.id },
    create: { id: session.user.id, ...data },
    update: data,
  });

  return Response.json({ message: "მონაცემები შენახულია" });
}
