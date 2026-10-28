import { isUuid, jsonError } from "@/lib/api";
import { getAvailableTimes } from "@/lib/availability";
import { visibleClinicWhere } from "@/lib/doctors";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { isValidDay } from "@/lib/time";

// ექიმის თავისუფალი დროები კლინიკაში: /api/doctors/{id}/slots?date=2026-10-15&clinicId={id}
export async function GET(
  request: Request,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const { doctorId } = await params;
  const searchParams = new URL(request.url).searchParams;
  const date = searchParams.get("date") ?? "";
  const clinicId = searchParams.get("clinicId") ?? "";

  if (!isUuid(doctorId) || !isUuid(clinicId)) {
    return jsonError("ექიმი ვერ მოიძებნა", 404);
  }

  if (!isValidDay(date)) {
    return jsonError("თარიღი არასწორია", 400);
  }

  // დაუდასტურებელ ან დაურეგისტრირებელ ექიმთან ჩაწერა არ შეიძლება, ამიტომ მის დროებსაც არ ვაჩვენებთ
  // გრაფიკი თითო კლინიკას თავისი აქვს
  const membership = await prisma.doctorClinic.findFirst({
    where: { doctorId, clinicId, ...visibleClinicWhere },
    select: { workStart: true, workEnd: true, workDays: true, daysOff: true },
  });

  if (!membership) {
    return jsonError("ექიმი ვერ მოიძებნა", 404);
  }

  // შესულ პაციენტს ის დროებიც არ უჩანს, როცა სხვა ექიმთან აქვს ვიზიტი
  const session = await getSession();
  const patientId = session?.user.accountType === "PATIENT" ? session.user.id : undefined;

  // დაკავებული, გასული და არასამუშაო დღის დროები უკვე გაფილტრულია
  const times = await getAvailableTimes({ id: doctorId, ...membership }, date, patientId);

  return Response.json({ times });
}
