import { z } from "zod";
import { isUuid, jsonError, readJson } from "@/lib/api";
import { activeDoctorWhere, removeDoctors } from "@/lib/doctors";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDay, formatTime, generateTimes, isValidDay, isValidTime, isWorkingDay } from "@/lib/time";

const doctorSchema = z.object({
  workStart: z.string().refine(isValidTime, "დრო უნდა იყოს ფორმატით 10:00"),
  workEnd: z.string().refine(isValidTime, "დრო უნდა იყოს ფორმატით 10:00"),
  // 0 — კვირა ... 6 — შაბათი; ერთი დღე მაინც
  workDays: z
    .array(z.number().int().min(0).max(6))
    .min(1, "აირჩიე ერთი სამუშაო დღე მაინც")
    .transform((days) => [...new Set(days)].sort()),
  // დასვენების დღეები; წარსულს არ ვინახავთ
  daysOff: z
    .array(z.string().refine(isValidDay, "თარიღი არასწორია"))
    .max(60, "მაქსიმუმ 60 დასვენების დღე")
    .transform((days) => [...new Set(days)].filter((day) => day >= formatDay(new Date())).sort()),
  // კაბინეტს მხოლოდ კლინიკა ცვლის
  room: z.string().trim().optional(),
});

// ეძებს ექიმს და ამოწმებს, ვინ არის მომხმარებელი მის მიმართ
async function findDoctor(doctorId: string) {
  const session = await getSession();

  if (!session) {
    return { error: jsonError("შესვლა საჭიროა", 401) };
  }

  if (!isUuid(doctorId)) {
    return { error: jsonError("ექიმი ვერ მოიძებნა", 404) };
  }

  // უარყოფილი და მოხსნილი ექიმი აღარ რედაქტირდება
  const doctor = await prisma.doctor.findFirst({ where: { id: doctorId, ...activeDoctorWhere } });
  if (!doctor) {
    return { error: jsonError("ექიმი ვერ მოიძებნა", 404) };
  }

  return {
    doctor,
    isClinic: doctor.clinicId === session.user.id,
    // ექიმი თავის გრაფიკს კლინიკის დადასტურების შემდეგ ცვლის
    isDoctor: doctor.userId === session.user.id && doctor.isApproved,
    isAdmin: session.user.role === "admin",
  };
}

// ექიმის გრაფიკის (საათები, დღეები, დასვენება) და კაბინეტის შეცვლა
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const { doctorId } = await params;
  const found = await findDoctor(doctorId);
  if (found.error) return found.error;

  const { doctor, isClinic, isDoctor } = found;
  if (!isClinic && !isDoctor) {
    return jsonError("ამ ექიმის რედაქტირება არ შეგიძლია", 403);
  }

  const result = doctorSchema.safeParse(await readJson(request));
  if (!result.success) {
    return jsonError(result.error.issues[0]?.message ?? "შეამოწმე შევსებული ველები", 400);
  }

  const { workStart, workEnd, workDays, daysOff, room } = result.data;

  // "10:00" < "18:00" — ერთნაირი ფორმატის დროები ტექსტადაც სწორად დარდება
  if (workStart >= workEnd) {
    return jsonError("სამუშაოს დასაწყისი დასრულებაზე ადრე უნდა იყოს", 400);
  }

  // საათებს და დღეებს ორივე ცვლის, კაბინეტს — მხოლოდ კლინიკა
  await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      workStart,
      workEnd,
      workDays,
      daysOff,
      ...(isClinic && { room: room || null }),
    },
  });

  // უკვე დაჯავშნილი ვიზიტები ავტომატურად არ უქმდება — ვაფრთხილებთ,
  // თუ რომელიმე ახალი გრაფიკის გარეთ დარჩა
  const booked = await prisma.appointment.findMany({
    where: { doctorId: doctor.id, status: "BOOKED", startsAt: { gt: new Date() } },
    select: { startsAt: true },
  });
  const times = generateTimes(workStart, workEnd);
  const outside = booked.filter(
    ({ startsAt }) =>
      !isWorkingDay({ workDays, daysOff }, formatDay(startsAt)) || !times.includes(formatTime(startsAt)),
  ).length;

  return Response.json({
    message:
      outside > 0
        ? `შენახულია. ყურადღება: ${outside} დაჯავშნილი ვიზიტი ახალი გრაფიკის გარეთაა — გადახედე და საჭიროებისას გააუქმე.`
        : "ცვლილებები შენახულია",
  });
}

// ექიმის კლინიკიდან მოხსნა — კლინიკა ან ადმინი. მომავალი ვიზიტები უქმდება,
// ისტორია რჩება, ექიმი კი სხვა კლინიკას აირჩევს
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const { doctorId } = await params;
  const found = await findDoctor(doctorId);
  if (found.error) return found.error;

  const { doctor, isClinic, isAdmin } = found;
  if (!isClinic && !isAdmin) {
    return jsonError("ექიმის მოხსნა მხოლოდ კლინიკას შეუძლია", 403);
  }

  if (!doctor.isApproved) {
    return jsonError("ჯერ დაუდასტურებელ მოთხოვნას „უარყოფა“ სჭირდება", 400);
  }

  await prisma.$transaction((transaction) =>
    removeDoctors(transaction, [doctor.id], isClinic ? "CLINIC" : "ADMIN", "ექიმი კლინიკაში აღარ მუშაობს"),
  );

  return Response.json({ message: "ექიმი კლინიკიდან მოიხსნა" });
}
