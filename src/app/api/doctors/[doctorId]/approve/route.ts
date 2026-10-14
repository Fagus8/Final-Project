import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getDoctorUserId, notify } from "@/lib/notifications";
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

  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId: session.user.id, isApproved: false },
  });

  if (!doctor) {
    return { error: Response.json({ message: "ექიმის მოთხოვნა ვერ მოიძებნა" }, { status: 404 }) };
  }

  return { doctor };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const { doctorId } = await params;
  const { doctor, error } = await findPendingDoctor(doctorId);
  if (error) return error;

  await prisma.doctor.update({
    where: { id: doctor.id },
    data: { isApproved: true },
  });

  await notify(await getDoctorUserId(doctor.email), "კლინიკამ დაადასტურა შენი რეგისტრაცია. პაციენტებს უკვე შეუძლიათ შენთან ჩაწერა.");

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

  await notify(await getDoctorUserId(doctor.email), "კლინიკამ უარყო შენი მოთხოვნა. შეგიძლია სხვა კლინიკა აირჩიო.");

  return Response.json({ message: "მოთხოვნა უარყოფილია" });
}
