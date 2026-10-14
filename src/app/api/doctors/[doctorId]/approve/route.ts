import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { notify } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

// კლინიკა ადასტურებს (POST) ან უარყოფს (DELETE) ექიმის მოთხოვნას
async function findPendingDoctor(doctorId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { error: Response.json({ message: "შესვლა საჭიროა" }, { status: 401 }) };
  }

  if (!z.string().uuid().safeParse(doctorId).success) {
    return { error: Response.json({ message: "ექიმი ვერ მოიძებნა" }, { status: 404 }) };
  }

  // მოთხოვნა = დაუდასტურებელი ექიმი, რომელსაც ანგარიში აქვს
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId: session.user.id, isApproved: false, userId: { not: null } },
    include: { user: { select: { email: true } } },
  });

  if (!doctor || !doctor.userId || !doctor.user) {
    return { error: Response.json({ message: "ექიმის მოთხოვნა ვერ მოიძებნა" }, { status: 404 }) };
  }

  return { doctor: { ...doctor, userId: doctor.userId, accountEmail: doctor.user.email } };
}

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
    // ელფოსტას ვწერთ, თუ სხვა ექიმს უკვე არ აქვს
    const emailTaken = await prisma.doctor.findUnique({ where: { email: doctor.accountEmail } });
    await prisma.doctor.update({
      where: { id: doctor.id },
      data: { isApproved: true, ...(emailTaken ? {} : { email: doctor.accountEmail }) },
    });
  }

  await notify(doctor.userId, "კლინიკამ დაადასტურა შენი რეგისტრაცია. პაციენტებს უკვე შეუძლიათ შენთან ჩაწერა.");

  return Response.json({ message: "ექიმი დადასტურდა" });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const { doctorId } = await params;
  const { doctor, error } = await findPendingDoctor(doctorId);
  if (error) return error;

  await prisma.doctor.delete({ where: { id: doctor.id } });

  await notify(doctor.userId, "კლინიკამ უარყო შენი მოთხოვნა. შეგიძლია სხვა კლინიკა აირჩიო.");

  return Response.json({ message: "მოთხოვნა უარყოფილია" });
}
