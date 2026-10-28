import { z } from "zod";
import { jsonError, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

const doctorSchema = z.object({
  // სპეციალობა და გამოცდილება მხოლოდ პირველ მოთხოვნაზეა საჭირო —
  // შემდეგ მათ მხოლოდ კლინიკა ცვლის
  specialty: z.string().trim().min(1).optional(),
  experienceYears: z.number().int().min(0).optional(),
  // ერთი ან რამდენიმე კლინიკა
  clinicIds: z.array(z.string().uuid()).min(1).max(20),
});

// ექიმი თვითონ რეგისტრირდება და ირჩევს ერთ ან რამდენიმე კლინიკას.
// თითოეული კლინიკა მას „ახალი ექიმების“ სიაში ნახავს და დაადასტურებს
export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return jsonError("შესვლა საჭიროა", 401);
  }

  if (session.user.accountType !== "DOCTOR") {
    return jsonError("ეს მოქმედება მხოლოდ ექიმის ანგარიშისთვისაა", 403);
  }

  const result = doctorSchema.safeParse(await readJson(request));
  if (!result.success) {
    return jsonError("შეამოწმე შევსებული ველები", 400);
  }

  const clinicIds = [...new Set(result.data.clinicIds)];
  const clinics = await prisma.clinic.findMany({
    where: { id: { in: clinicIds }, isApproved: true },
    select: { id: true },
  });

  if (clinics.length !== clinicIds.length) {
    return jsonError("კლინიკა ვერ მოიძებნა", 404);
  }

  // ერთ ანგარიშს მხოლოდ ერთი ექიმის ჩანაწერი აქვს
  const existing = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    include: { clinics: true },
  });

  if (!existing) {
    const { specialty, experienceYears } = result.data;
    if (!specialty || experienceYears === undefined) {
      return jsonError("შეავსე სპეციალობა და გამოცდილება", 400);
    }

    // მოთხოვნა = დაუდასტურებელი კავშირი კლინიკასთან
    await prisma.doctor.create({
      data: {
        name: session.user.name,
        specialty,
        experienceYears,
        userId: session.user.id,
        clinics: { create: clinicIds.map((clinicId) => ({ clinicId })) },
      },
    });
    return Response.json({ message: "მოთხოვნა გაიგზავნა კლინიკებთან" });
  }

  // აქტიური მოთხოვნა ან კავშირი უკვე აქვს — ხელახლა არ ვაგზავნით
  const active = existing.clinics.filter((item) => !item.rejectedAt && !item.removedAt);
  const newIds = clinicIds.filter((id) => !active.some((item) => item.clinicId === id));

  if (newIds.length === 0) {
    return jsonError("ამ კლინიკებთან მოთხოვნა უკვე გაგზავნილია.", 409);
  }

  // სანამ არცერთ კლინიკას არ დაუდასტურებია, ექიმს სპეციალობის შესწორება შეუძლია
  const canEditProfile = !existing.clinics.some((item) => item.isApproved);

  await prisma.$transaction([
    ...newIds.map((clinicId) =>
      // უარყოფილი ან მოხსნილი ექიმი იმავე კლინიკას ხელახლა სთხოვს — ძველი ჩანაწერი
      // თავიდან მოლოდინში გადადის, გრაფიკი და კაბინეტი ნაგულისხმევზე ბრუნდება
      prisma.doctorClinic.upsert({
        where: { doctorId_clinicId: { doctorId: existing.id, clinicId } },
        create: { doctorId: existing.id, clinicId },
        update: {
          isApproved: false,
          rejectedAt: null,
          removedAt: null,
          room: null,
          workStart: "10:00",
          workEnd: "18:00",
          workDays: [1, 2, 3, 4, 5, 6],
          daysOff: [],
          createdAt: new Date(),
        },
      }),
    ),
    ...(canEditProfile
      ? [
          prisma.doctor.update({
            where: { id: existing.id },
            data: {
              specialty: result.data.specialty,
              experienceYears: result.data.experienceYears,
            },
          }),
        ]
      : []),
  ]);

  return Response.json({
    message: newIds.length > 1 ? "მოთხოვნა გაიგზავნა კლინიკებთან" : "მოთხოვნა გაიგზავნა კლინიკასთან",
  });
}
