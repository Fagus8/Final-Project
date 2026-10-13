import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import styles from "../dashboard/Dashboard.module.scss";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.user.accountType !== "PATIENT" || session.user.role === "admin") {
    redirect("/dashboard");
  }

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>ჩემი პროფილი</h1>

        <section className={styles.details} aria-label="პროფილის ინფორმაცია">
          <article className={styles.detailCard}>
            <span className={styles.detailLabel}>სახელი</span>
            <span className={styles.detailValue}>{session.user.name}</span>
          </article>
          <article className={styles.detailCard}>
            <span className={styles.detailLabel}>ელფოსტა</span>
            <span className={styles.detailValue}>{session.user.email}</span>
          </article>
        </section>
      </main>
    </div>
  );
}
