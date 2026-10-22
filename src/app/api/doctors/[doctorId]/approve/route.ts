import { isUuid, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// კლინიკა ადასტურებს (POST) ან უარყოფს (DELETE) ექიმის მოთხოვნას.
// მოთხოვნა = დაუდასტურებელი ექიმი, რომელსაც ანგარიში აქვს.

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
    where: { id: doctorId, clinicId: session.user.id, isApproved: false, userId: { not: null } },
    include: { user: { select: { email: true } } },
  });

  if (!doctor || !doctor.userId || !doctor.user) {
    return { error: jsonError("ექიმის მოთხოვნა ვერ მოიძებნა", 404) };
  }

  return {
    doctor: {
      id: doctor.id,
      clinicId: doctor.clinicId,
      userId: doctor.userId,
      accountEmail: doctor.user.email,
    },
  };
}

// დადასტურება
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const { doctorId } = await params;
  const { doctor, error } = await findPendingDoctor(doctorId);
  if (error) return error;

  // თუ კლინიკას ამ ელფოსტით მოწვეული (ანგარიშის გარეშე) ექიმი ჰყავს,
  // ანგარიშს მას ვაბამთ და მოთხოვნის ჩანაწერს ვშლით — ვიზიტები და პროფილი რჩება
  const invited = await prisma.doctor.findFirst({
    where: { clinicId: doctor.clinicId, email: doctor.accountEmail, userId: null },
  });

  if (invited) {
    await prisma.$transaction([
      prisma.doctor.delete({ where: { id: doctor.id } }),
      prisma.doctor.update({ where: { id: invited.id }, data: { userId: doctor.userId } }),
    ]);
  } else {
    // ელფოსტას ვწერთ მხოლოდ მაშინ, თუ სხვა ექიმს უკვე არ აქვს (ველი უნიკალურია)
    const emailTaken = await prisma.doctor.findUnique({ where: { email: doctor.accountEmail } });
    await prisma.doctor.update({
      where: { id: doctor.id },
      data: emailTaken ? { isApproved: true } : { isApproved: true, email: doctor.accountEmail },
    });
  }

  return Response.json({ message: "ექიმი დადასტურდა" });
}

// უარყოფა: მოთხოვნის ჩანაწერი იშლება, ექიმს სხვა კლინიკის არჩევა შეუძლია
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const { doctorId } = await params;
  const { doctor, error } = await findPendingDoctor(doctorId);
  if (error) return error;

  await prisma.doctor.delete({ where: { id: doctor.id } });

  return Response.json({ message: "მოთხოვნა უარყოფილია" });
}
