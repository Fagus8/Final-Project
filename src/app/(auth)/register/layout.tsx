import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// სესია ყოველ ჯერზე უნდა შემოწმდეს, ამიტომ გვერდი არ იქეშება
export const dynamic = "force-dynamic";

// რეგისტრაციის გვერდის ჩარჩო: უკვე შესულ მომხმარებელს
// რეგისტრაციის ნაცვლად მის გვერდზე ვაბრუნებთ
export default async function RegisterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect(session.user.role === "admin" ? "/admin/clinics" : "/dashboard");
  }

  return children;
}
