import { isUuid, jsonError } from "@/lib/api";
import { removeDoctors } from "@/lib/doctors";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// კლინიკის წაშლა — ადმინს ან თავად კლინიკას შეუძლია.
// კლინიკა თავის ანგარიშზეა მიბმული, ამიტომ ვშლით ანგარიშს და მასთან ერთად
// (cascade) იშლება კლინიკა და მისი ექიმების ჩანაწერები. ვიზიტები კი რჩება:
// მომავალი უქმდება მიზეზით, წარსული (დიაგნოზით) პაციენტის ისტორიაში ინახება
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const session = await getSession();

  if (!session) {
    return jsonError("შესვლა საჭიროა", 401);
  }

  const { clinicId } = await params;
  if (!isUuid(clinicId)) {
    return jsonError("კლინიკა ვერ მოიძებნა", 404);
  }

  const isAdmin = session.user.role === "admin";
  const isOwner = session.user.accountType === "CLINIC" && session.user.id === clinicId;

  if (!isAdmin && !isOwner) {
    return jsonError("ამ კლინიკის წაშლა არ შეგიძლია", 403);
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { doctors: { select: { id: true } } },
  });

  if (!clinic) {
    return jsonError("კლინიკა ვერ მოიძებნა", 404);
  }

  await prisma.$transaction(async (transaction) => {
    await removeDoctors(
      transaction,
      clinic.doctors.map((doctor) => doctor.id),
      isOwner ? "CLINIC" : "ADMIN",
      "კლინიკა სისტემიდან წაიშალა",
    );
    await transaction.user.delete({ where: { id: clinicId } });
  });

  return Response.json({ message: "კლინიკა წაიშალა" });
}
