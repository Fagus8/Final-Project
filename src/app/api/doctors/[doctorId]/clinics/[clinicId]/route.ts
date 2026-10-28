import { z } from "zod";
import { isUuid, jsonError, readJson } from "@/lib/api";
import { activeClinicWhere, removeDoctorsFromClinic } from "@/lib/doctors";
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

// ეძებს ექიმის კავშირს კლინიკასთან და ამოწმებს, ვინ არის მომხმარებელი მის მიმართ
async function findMembership(doctorId: string, clinicId: string) {
  const session = await getSession();

  if (!session) {
    return { error: jsonError("შესვლა საჭიროა", 401) };
  }

  if (!isUuid(doctorId) || !isUuid(clinicId)) {
    return { error: jsonError("ექიმი ვერ მოიძებნა", 404) };
  }

  // უარყოფილი და მოხსნილი კავშირი აღარ რედაქტირდება
  const membership = await prisma.doctorClinic.findFirst({
    where: { doctorId, clinicId, ...activeClinicWhere },
    include: { doctor: { select: { userId: true } } },
  });
  if (!membership) {
    return { error: jsonError("ექიმი ვერ მოიძებნა", 404) };
  }

  return {
    membership,
    isClinic: clinicId === session.user.id,
    // ექიმი ამ კლინიკის გრაფიკს მისი დადასტურების შემდეგ ცვლის
    isDoctor: membership.doctor.userId === session.user.id && membership.isApproved,
    isAdmin: session.user.role === "admin",
  };
}

// ექიმის ამ კლინიკის გრაფიკის (საათები, დღეები, დასვენება) და კაბინეტის შეცვლა
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ doctorId: string; clinicId: string }> },
) {
  const { doctorId, clinicId } = await params;
  const found = await findMembership(doctorId, clinicId);
  if (found.error) return found.error;

  const { membership, isClinic, isDoctor } = found;
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
  await prisma.doctorClinic.update({
    where: { id: membership.id },
    data: {
      workStart,
      workEnd,
      workDays,
      daysOff,
      ...(isClinic && { room: room || null }),
    },
  });

  // ამ კლინიკაში უკვე დაჯავშნილი ვიზიტები ავტომატურად არ უქმდება — ვაფრთხილებთ,
  // თუ რომელიმე ახალი გრაფიკის გარეთ დარჩა
  const booked = await prisma.appointment.findMany({
    where: { doctorId, clinicId, status: "BOOKED", startsAt: { gt: new Date() } },
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

// ექიმის ამ კლინიკიდან მოხსნა — კლინიკა ან ადმინი. აქ მომავალი ვიზიტები უქმდება,
// ისტორია რჩება, სხვა კლინიკებში კი ექიმი ისევ მუშაობს
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ doctorId: string; clinicId: string }> },
) {
  const { doctorId, clinicId } = await params;
  const found = await findMembership(doctorId, clinicId);
  if (found.error) return found.error;

  const { membership, isClinic, isAdmin } = found;
  if (!isClinic && !isAdmin) {
    return jsonError("ექიმის მოხსნა მხოლოდ კლინიკას შეუძლია", 403);
  }

  if (!membership.isApproved) {
    return jsonError("ჯერ დაუდასტურებელ მოთხოვნას „უარყოფა“ სჭირდება", 400);
  }

  await prisma.$transaction((transaction) =>
    removeDoctorsFromClinic(
      transaction,
      clinicId,
      [doctorId],
      isClinic ? "CLINIC" : "ADMIN",
      "ექიმი კლინიკაში აღარ მუშაობს",
    ),
  );

  return Response.json({ message: "ექიმი კლინიკიდან მოიხსნა" });
}
