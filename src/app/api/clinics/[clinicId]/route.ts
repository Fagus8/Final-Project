import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/slots";

// კლინიკის წაშლა — ადმინს ან თავად კლინიკას შეუძლია.
// კლინიკა თავის ანგარიშზეა მიბმული, ამიტომ ვშლით ანგარიშს და მასთან ერთად
// (cascade) იშლება კლინიკა, მისი ექიმები და ვიზიტები.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ message: "შესვლა საჭიროა" }, { status: 401 });
  }

  const { clinicId } = await params;
  if (!z.string().uuid().safeParse(clinicId).success) {
    return Response.json({ message: "კლინიკა ვერ მოიძებნა" }, { status: 404 });
  }

  const isAdmin = session.user.role === "admin";
  const isOwner = session.user.accountType === "CLINIC" && session.user.id === clinicId;

  if (!isAdmin && !isOwner) {
    return Response.json({ message: "ამ კლინიკის წაშლა არ შეგიძლია" }, { status: 403 });
  }

  const deleted = await prisma.$transaction(async (transaction) => {
    const clinic = await transaction.clinic.findUnique({
      where: { id: clinicId },
      include: {
        doctors: {
          include: {
            appointments: {
              where: { status: "BOOKED", startsAt: { gte: new Date() } },
            },
          },
        },
      },
    });

    if (!clinic) {
      return false;
    }

    // პაციენტებს ვატყობინებთ, რომ მომავალი ვიზიტები გაუქმდა
    const patientMessages = clinic.doctors.flatMap((doctor) =>
      doctor.appointments.map((appointment) => ({
        userId: appointment.patientId,
        message: `ვიზიტი გაუქმდა: კლინიკა „${clinic.name}“ წაიშალა (${doctor.name}, ${formatDateTime(appointment.startsAt)})`,
      })),
    );

    // ექიმებს, რომლებსაც ანგარიში აქვთ, ვატყობინებთ, რომ კლინიკა აღარ არსებობს
    const doctorUserIds = clinic.doctors.flatMap((doctor) => (doctor.userId ? [doctor.userId] : []));
    const doctorMessages = doctorUserIds.map((userId) => ({
      userId,
      message: `კლინიკა „${clinic.name}“ წაიშალა. შეგიძლია სხვა კლინიკას შეუერთდე.`,
    }));

    await transaction.notification.createMany({
      data: [...patientMessages, ...doctorMessages],
    });

    await transaction.user.delete({ where: { id: clinicId } });

    return true;
  });

  if (!deleted) {
    return Response.json({ message: "კლინიკა ვერ მოიძებნა" }, { status: 404 });
  }

  return Response.json({ message: "კლინიკა წაიშალა" });
}
