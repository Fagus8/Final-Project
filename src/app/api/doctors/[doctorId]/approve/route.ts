import { isUuid, jsonError } from "@/lib/api";
import { activeDoctorWhere } from "@/lib/doctors";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// კლინიკა ადასტურებს (POST) ან უარყოფს (DELETE) ექიმის მოთხოვნას.
// მოთხოვნა = დაუდასტურებელი ექიმი ამ კლინიკაში.

// ეძებს ამ კლინიკის მოლოდინში მყოფ ექიმს. თუ ვერ იპოვა, აბრუნებს შეცდომის პასუხს
async function findPendingDoctor(doctorId: string) {
  const session = await getSession();

  if (!session) {
    return { error: jsonError("შესვლა საჭიროა", 401) };
  }

  if (!isUuid(doctorId)) {
    return { error: jsonError("ექიმი ვერ მოიძებნა", 404) };
  }

  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId: session.user.id, isApproved: false, ...activeDoctorWhere },
    select: { id: true },
  });

  if (!doctor) {
    return { error: jsonError("ექიმის მოთხოვნა ვერ მოიძებნა", 404) };
  }

  return { doctor };
}

// დადასტურება
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const { doctorId } = await params;
  const { doctor, error } = await findPendingDoctor(doctorId);
  if (error) return error;

  await prisma.doctor.update({ where: { id: doctor.id }, data: { isApproved: true } });

  return Response.json({ message: "ექიმი დადასტურდა" });
}

// უარყოფა: ჩანაწერი რჩება უარყოფის თარიღით — ექიმი „ჩემ განრიგში“ ნახავს,
// რომ მოთხოვნა უარყვეს, და სხვა კლინიკას აირჩევს
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const { doctorId } = await params;
  const { doctor, error } = await findPendingDoctor(doctorId);
  if (error) return error;

  await prisma.doctor.update({ where: { id: doctor.id }, data: { rejectedAt: new Date() } });

  return Response.json({ message: "მოთხოვნა უარყოფილია" });
}
