import { prisma } from "./prisma";

// შეტყობინების შექმნა მომხმარებლისთვის (ჩანს ზარის იკონზე და /notifications-ზე)
export async function notify(userId: string | null | undefined, message: string) {
  // ექიმს შეიძლება ანგარიში არ ჰქონდეს (userId = null) — მაშინ ვის გავუგზავნოთ, არავინაა
  if (!userId) {
    return;
  }

  await prisma.notification.create({
    data: { userId, message },
  });
}
