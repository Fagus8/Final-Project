import { z } from "zod";
import { getAvailableTimes } from "@/lib/appointments";
import { prisma } from "@/lib/prisma";
import { isValidDay } from "@/lib/slots";

// ექიმის თავისუფალი დროები: /api/doctors/{id}/slots?date=2026-10-15
export async function GET(
  request: Request,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const { doctorId } = await params;
  const date = new URL(request.url).searchParams.get("date") ?? "";

  if (!z.string().uuid().safeParse(doctorId).success) {
    return Response.json({ message: "ექიმი ვერ მოიძებნა" }, { status: 404 });
  }

  if (!isValidDay(date)) {
    return Response.json({ message: "თარიღი არასწორია" }, { status: 400 });
  }

  // დაუდასტურებელ ექიმთან ჩაწერა არ შეიძლება, ამიტომ მის დროებსაც არ ვაჩვენებთ
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, isApproved: true },
    select: { id: true, workStart: true, workEnd: true },
  });

  if (!doctor) {
    return Response.json({ message: "ექიმი ვერ მოიძებნა" }, { status: 404 });
  }

  // დაკავებული, გასული და კვირის დროები უკვე გაფილტრულია
  const times = await getAvailableTimes(doctor, date);

  return Response.json({ times });
}
