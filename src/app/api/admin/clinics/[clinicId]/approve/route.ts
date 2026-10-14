import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ message: "შესვლა საჭიროა" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return Response.json({ message: "ადმინის უფლება საჭიროა" }, { status: 403 });
  }

  const { clinicId } = await params;
  if (!z.string().uuid().safeParse(clinicId).success) {
    return Response.json({ message: "კლინიკა ვერ მოიძებნა" }, { status: 404 });
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true },
  });

  if (!clinic) {
    return Response.json({ message: "კლინიკა ვერ მოიძებნა" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.clinic.update({
      where: { id: clinicId },
      data: { isApproved: true },
    }),
    // მხოლოდ კლინიკის მიერ დამატებული ექიმები. ექიმის საკუთარ მოთხოვნას
    // (ანგარიშით) კლინიკა თვითონ ადასტურებს
    prisma.doctor.updateMany({
      where: { clinicId, userId: null },
      data: { isApproved: true },
    }),
  ]);

  return Response.json({ message: "კლინიკა და მისი ექიმები დამტკიცებულია" });
}
