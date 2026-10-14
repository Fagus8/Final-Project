import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { BLOOD_TYPES } from "@/lib/blood-types";
import { prisma } from "@/lib/prisma";

const patientSchema = z.object({
  phone: z.string().trim().min(1).max(30),
  // "" — პაციენტმა სისხლის ჯგუფი ჯერ არ იცის
  bloodType: z.union([z.enum(BLOOD_TYPES), z.literal("")]),
});

// პაციენტის დამატებითი მონაცემები: ტელეფონი და სისხლის ჯგუფი
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ message: "შესვლა საჭიროა" }, { status: 401 });
  }

  if (session.user.accountType !== "PATIENT") {
    return Response.json({ message: "ეს მოქმედება მხოლოდ პაციენტისთვისაა" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "მოთხოვნის მონაცემები არასწორია" }, { status: 400 });
  }

  const result = patientSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ message: "შეამოწმე შევსებული ველები" }, { status: 400 });
  }

  const data = { phone: result.data.phone, bloodType: result.data.bloodType || null };

  await prisma.patient.upsert({
    where: { id: session.user.id },
    create: { id: session.user.id, ...data },
    update: data,
  });

  return Response.json({ message: "მონაცემები შენახულია" });
}
