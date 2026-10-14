import { prisma } from "@/lib/prisma";

// დამტკიცებული კლინიკების სია (ექიმის რეგისტრაციისთვის)
export async function GET() {
  const clinics = await prisma.clinic.findMany({
    where: { isApproved: true },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  return Response.json({ clinics });
}
