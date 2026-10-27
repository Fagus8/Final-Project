import { isUuid, jsonError } from "@/lib/api";
import { getAvailableTimes } from "@/lib/availability";
import { visibleDoctorWhere } from "@/lib/doctors";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isValidDay } from "@/lib/time";

// ექიმის თავისუფალი დროები: /api/doctors/{id}/slots?date=2026-10-15
export async function GET(
  request: Request,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const { doctorId } = await params;
  const date = new URL(request.url).searchParams.get("date") ?? "";

  if (!isUuid(doctorId)) {
    return jsonError("ექიმი ვერ მოიძებნა", 404);
  }

  if (!isValidDay(date)) {
    return jsonError("თარიღი არასწორია", 400);
  }

  // დაუდასტურებელ ან დაურეგისტრირებელ ექიმთან ჩაწერა არ შეიძლება, ამიტომ მის დროებსაც არ ვაჩვენებთ
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, ...visibleDoctorWhere },
    select: { id: true, workStart: true, workEnd: true, workDays: true, daysOff: true },
  });

  if (!doctor) {
    return jsonError("ექიმი ვერ მოიძებნა", 404);
  }

  // შესულ პაციენტს ის დროებიც არ უჩანს, როცა სხვა ექიმთან აქვს ვიზიტი
  const session = await getSession();
  const patientId = session?.user.accountType === "PATIENT" ? session.user.id : undefined;

  // დაკავებული, გასული და არასამუშაო დღის დროები უკვე გაფილტრულია
  const times = await getAvailableTimes(doctor, date, patientId);

  return Response.json({ times });
}
