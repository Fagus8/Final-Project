import { isUuid, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// ადმინი ამტკიცებს კლინიკას. ამის შემდეგ კლინიკა და მისი ექიმები საიტზე ჩნდება
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const session = await getSession();

  if (!session) {
    return jsonError("შესვლა საჭიროა", 401);
  }

  if (session.user.role !== "admin") {
    return jsonError("ადმინის უფლება საჭიროა", 403);
  }

  const { clinicId } = await params;
  if (!isUuid(clinicId)) {
    return jsonError("კლინიკა ვერ მოიძებნა", 404);
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true },
  });

  if (!clinic) {
    return jsonError("კლინიკა ვერ მოიძებნა", 404);
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
