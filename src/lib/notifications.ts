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
