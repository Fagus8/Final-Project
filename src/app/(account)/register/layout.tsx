import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RegisterLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect(session.user.role === "admin" ? "/admin/clinics" : "/dashboard");
  }

  return children;
}
