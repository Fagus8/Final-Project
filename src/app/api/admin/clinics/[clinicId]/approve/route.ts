import { isUuid, jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// ადმინი ამტკიცებს კლინიკას. ამის შემდეგ კლინიკა საიტზე ჩნდება და ექიმებს
// შეუძლიათ მისი არჩევა
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

  // ექიმებს კლინიკა თვითონ ადასტურებს (ექიმი დამტკიცებულ კლინიკას ირჩევს)
  await prisma.clinic.update({
    where: { id: clinicId },
    data: { isApproved: true },
  });

  return Response.json({ message: "კლინიკა დამტკიცებულია" });
}
