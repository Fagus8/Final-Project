import { isUuid, jsonError } from "@/lib/api";
import { activeClinicWhere } from "@/lib/doctors";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// კლინიკა ადასტურებს (POST) ან უარყოფს (DELETE) ექიმის მოთხოვნას.
// მოთხოვნა = ექიმის დაუდასტურებელი კავშირი ამ კლინიკასთან.
// სხვა კლინიკებთან ექიმის კავშირებს ეს არ ეხება

// ეძებს ამ კლინიკაში ექიმის მოლოდინში მყოფ მოთხოვნას. თუ ვერ იპოვა, აბრუნებს შეცდომის პასუხს
async function findPendingRequest(doctorId: string) {
  const session = await getSession();

  if (!session) {
    return { error: jsonError("შესვლა საჭიროა", 401) };
  }

  if (!isUuid(doctorId)) {
    return { error: jsonError("ექიმი ვერ მოიძებნა", 404) };
  }

  const membership = await prisma.doctorClinic.findFirst({
    where: { doctorId, clinicId: session.user.id, isApproved: false, ...activeClinicWhere },
    select: { id: true },
  });

  if (!membership) {
    return { error: jsonError("ექიმის მოთხოვნა ვერ მოიძებნა", 404) };
  }

  return { membership };
}

// დადასტურება
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const { doctorId } = await params;
  const { membership, error } = await findPendingRequest(doctorId);
  if (error) return error;

  await prisma.doctorClinic.update({ where: { id: membership.id }, data: { isApproved: true } });

  return Response.json({ message: "ექიმი დადასტურდა" });
}

// უარყოფა: ჩანაწერი რჩება უარყოფის თარიღით — ექიმი „ჩემ განრიგში“ ნახავს,
// რომ ამ კლინიკამ მოთხოვნა უარყო
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ doctorId: string }> },
) {
  const { doctorId } = await params;
  const { membership, error } = await findPendingRequest(doctorId);
  if (error) return error;

  await prisma.doctorClinic.update({ where: { id: membership.id }, data: { rejectedAt: new Date() } });

  return Response.json({ message: "მოთხოვნა უარყოფილია" });
}
