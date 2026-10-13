import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const clinicUpdateSchema = z.object({
  name: z.string().trim().min(1),
  city: z.string().trim().min(1),
  address: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  specialty: z.string().trim().min(1),
  imageUrl: z.string().trim(),
  doctors: z.array(
    z.object({
      id: z.string().uuid().optional(),
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
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ message: "შესვლა საჭიროა" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return Response.json({ message: "ადმინის უფლება საჭიროა" }, { status: 403 });
  }

  const { clinicId } = await params;
  if (!z.string().uuid().safeParse(clinicId).success) {
    return Response.json({ message: "კლინიკა ვერ მოიძებნა" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "მოთხოვნის მონაცემები არასწორია" }, { status: 400 });
  }

  const result = clinicUpdateSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ message: "შეამოწმე შევსებული ველები" }, { status: 400 });
  }

  const updateResult = await prisma.$transaction(async (transaction) => {
    const clinic = await transaction.clinic.findUnique({
      where: { id: clinicId },
      select: {
        id: true,
        isApproved: true,
        doctors: { select: { id: true } },
      },
    });

    if (!clinic) {
      return "not-found";
    }

    const submittedDoctorIds = result.data.doctors.flatMap((doctor) =>
      doctor.id ? [doctor.id] : [],
    );
    const currentDoctorIds = clinic.doctors.map((doctor) => doctor.id);
    if (
      new Set(submittedDoctorIds).size !== submittedDoctorIds.length ||
      submittedDoctorIds.some((id) => !currentDoctorIds.includes(id))
    ) {
      return "stale";
    }

    await transaction.clinic.update({
      where: { id: clinicId },
      data: {
        name: result.data.name,
        city: result.data.city,
        address: result.data.address,
        phone: result.data.phone,
        specialty: result.data.specialty,
        imageUrl: result.data.imageUrl || null,
      },
    });

    await transaction.doctor.deleteMany({
      where: {
        clinicId,
        ...(submittedDoctorIds.length > 0
          ? { id: { notIn: submittedDoctorIds } }
          : {}),
      },
    });

    for (const doctor of result.data.doctors) {
      if (doctor.id) {
        await transaction.doctor.update({
          where: { id: doctor.id },
          data: {
            name: doctor.name,
            specialty: doctor.specialty,
            experienceYears: doctor.experienceYears,
          },
        });
      } else {
        await transaction.doctor.create({
          data: {
            clinicId,
            name: doctor.name,
            specialty: doctor.specialty,
            experienceYears: doctor.experienceYears,
            isApproved: clinic.isApproved,
          },
        });
      }
    }

    return "updated";
  });

  if (updateResult === "not-found") {
    return Response.json({ message: "კლინიკა ვერ მოიძებნა" }, { status: 404 });
  }

  if (updateResult === "stale") {
    return Response.json(
      { message: "კლინიკის ექიმების სია შეიცვალა. განაახლე გვერდი და სცადე ხელახლა." },
      { status: 409 },
    );
  }

  return Response.json({ message: "კლინიკის მონაცემები განახლებულია" });
}
