import { prisma } from "./prisma";

// შეტყობინების შექმნა მომხმარებლისთვის
export async function notify(userId: string | null | undefined, message: string) {
  if (!userId) {
    return;
  }

  await prisma.notification.create({
    data: { userId, message },
  });
}

// ექიმის ანგარიშის id (თუ ექიმს ანგარიში აქვს)
export async function getDoctorUserId(email: string | null) {
  if (!email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return user?.id ?? null;
}
