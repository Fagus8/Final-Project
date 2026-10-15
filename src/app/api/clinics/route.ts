import { prisma } from "@/lib/prisma";

// GET /api/clinics — დამტკიცებული კლინიკების სია (ექიმის რეგისტრაციისთვის).
// მხოლოდ id, სახელი და ქალაქი, სხვა მონაცემი ფორმას არ სჭირდება
export async function GET() {
  const clinics = await prisma.clinic.findMany({
    where: { isApproved: true },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  return Response.json({ clinics });
}
