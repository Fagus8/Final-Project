import { z } from "zod";
import { jsonError, readJson } from "@/lib/api";
import { findDoctorInvitation } from "@/lib/doctors";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// მოწვევის მიღება: თუ კლინიკას ამ ელფოსტით ექიმი აქვს დამატებული, ექიმს
// კლინიკის არჩევა არ სჭირდება — მოთხოვნა ავტომატურად მომწვევ კლინიკას ეგზავნება.
// დადასტურებისას (approve) ანგარიში კლინიკის დამატებულ ჩანაწერს მიებმება.
// აბრუნებს invited: false-ს, თუ მოწვევა არ არის (მაშინ ექიმი კლინიკას „ჩემ განრიგში“ ირჩევს)

// რეგისტრაციისას ექიმის მითითებული სპეციალობა და გამოცდილება. კლინიკა მოთხოვნაში
// მათ საკუთარ ჩანაწერს ადარებს; დადასტურებისას კლინიკის ჩანაწერი რჩება.
// თუ არ გამოგზავნა („მოწვევის მიღება“ ღილაკი), კლინიკის მითითებულს ვიყენებთ
const bodySchema = z
  .object({
    specialty: z.string().trim().min(1).max(80),
    experienceYears: z.number().int().min(0).max(80),
  })
  .partial();

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return jsonError("შესვლა საჭიროა", 401);
  }

  if (session.user.accountType !== "DOCTOR") {
    return jsonError("ეს მოქმედება მხოლოდ ექიმის ანგარიშისთვისაა", 403);
  }

  // ერთ ანგარიშს მხოლოდ ერთი ექიმის ჩანაწერი აქვს
  const existing = await prisma.doctor.findUnique({ where: { userId: session.user.id } });
  if (existing) {
    return Response.json({ invited: false, message: "ანგარიში უკვე დაკავშირებულია ექიმთან" });
  }

  const invitation = await findDoctorInvitation(session.user.email);
  if (!invitation) {
    return Response.json({ invited: false, message: "" });
  }

  // ცარიელი ან არასწორი ტანი = ექიმს მონაცემები არ მიუთითებია
  const parsed = bodySchema.safeParse((await readJson(request)) ?? {});
  const body = parsed.success ? parsed.data : {};

  // მოთხოვნა = დაუდასტურებელი ექიმი ანგარიშით
  await prisma.doctor.create({
    data: {
      name: session.user.name,
      userId: session.user.id,
      specialty: body.specialty ?? invitation.specialty,
      experienceYears: body.experienceYears ?? invitation.experienceYears,
      clinicId: invitation.clinicId,
      isApproved: false,
    },
  });

  return Response.json({
    invited: true,
    message: `მოთხოვნა გაიგზავნა კლინიკაში ${invitation.clinic.name}`,
  });
}
