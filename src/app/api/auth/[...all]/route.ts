import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

// /api/auth/* — ყველა ავტორიზაციის მოთხოვნას (შესვლა, რეგისტრაცია,
// გასვლა, სესია) better-auth ამუშავებს
const authHandlers = toNextJsHandler(auth);

export const GET = authHandlers.GET;

export async function POST(request: Request) {
  const pathname = new URL(request.url).pathname;

  // შესულ მომხმარებელს ახალი ანგარიშის შექმნა არ შეუძლია —
  // თორემ ძველი სესია ახალ ანგარიშს აერეოდა
  if (pathname.endsWith("/sign-up/email")) {
    const session = await auth.api.getSession({ headers: request.headers });

    if (session) {
      return Response.json(
        { message: "გამოსული უნდა იყო ახალი ანგარიშის დასარეგისტრირებლად." },
        { status: 403 },
      );
    }
  }

  return authHandlers.POST(request);
}
