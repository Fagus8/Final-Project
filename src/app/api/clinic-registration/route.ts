import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const clinicSchema = z.object({
  name: z.string().trim().min(1),
  city: z.string().trim().min(1),
  address: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  specialty: z.string().trim().min(1),
  imageUrl: z.string().trim(),
  doctors: z.array(
    z.object({
      name: z.string().trim().min(1),
      specialty: z.string().trim().min(1),
      experienceYears: z.number().int().min(0),
    }),
  ).min(1),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ message: "შესასვლელი ხარ ანგარიშში" }, { status: 401 });
  }

  if (session.user.accountType !== "CLINIC") {
    return Response.json({ message: "ეს მოქმედება მხოლოდ კლინიკის ანგარიშისთვისაა" }, { status: 403 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "მოთხოვნის მონაცემები არასწორია" }, { status: 400 });
  }

  const result = clinicSchema.safeParse(body);

  if (!result.success) {
    return Response.json({ message: "შეამოწმე შევსებული ველები" }, { status: 400 });
  }

  const clinic = await prisma.clinic.upsert({
    where: { id: session.user.id },
    create: {
      id: session.user.id,
      name: result.data.name,
      city: result.data.city,
      address: result.data.address,
      phone: result.data.phone,
      specialty: result.data.specialty,
      imageUrl: result.data.imageUrl || null,
      isApproved: false,
      doctors: {
        create: result.data.doctors.map((doctor) => ({
          name: doctor.name,
          specialty: doctor.specialty,
          experienceYears: doctor.experienceYears,
          isApproved: false,
        })),
      },
    },
    update: {},
    select: { id: true },
  });

  return Response.json(
    { message: "კლინიკა და ექიმები გაიგზავნა დასამტკიცებლად", clinicId: clinic.id },
  );
}