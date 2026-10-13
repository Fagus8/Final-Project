import { headers } from "next/headers";
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
    prisma.doctor.updateMany({
      where: { clinicId },
      data: { isApproved: true },
    }),
  ]);

  return Response.json({ message: "კლინიკა და მისი ექიმები დამტკიცებულია" });
}
