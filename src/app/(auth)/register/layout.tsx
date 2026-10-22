import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

// სესია ყოველ ჯერზე უნდა შემოწმდეს, ამიტომ გვერდი არ იქეშება
export const dynamic = "force-dynamic";

// რეგისტრაციის გვერდის ჩარჩო: უკვე შესულ მომხმარებელს
// რეგისტრაციის ნაცვლად მის გვერდზე ვაბრუნებთ
export default async function RegisterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getSession();

  if (session) {
    redirect(session.user.role === "admin" ? "/admin/clinics" : "/dashboard");
  }

  return children;
}
