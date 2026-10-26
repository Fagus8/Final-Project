import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import styles from "../Account.module.scss";

// პაციენტის პროფილი: ანგარიშის მონაცემები (ჯანმრთელობის ინფორმაცია
// პირად კაბინეტშია)
export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // გვერდი მხოლოდ პაციენტისთვისაა
  if (session.user.accountType !== "PATIENT" || session.user.role === "admin") {
    redirect("/dashboard");
  }

  // ტელეფონი; რეგისტრაციამდე შექმნილ ანგარიშს შეიძლება არ ჰქონდეს
  const patient = await prisma.patient.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  });

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
          <article className={styles.detailCard}>
            <span className={styles.detailLabel}>ტელეფონი</span>
            <span className={styles.detailValue}>{patient?.phone ?? "არ არის მითითებული"}</span>
          </article>
          <article className={styles.detailCard}>
            <span className={styles.detailLabel}>ანგარიშის ტიპი</span>
            <span className={styles.accountType}>პაციენტი</span>
          </article>
          <article className={styles.detailCard}>
            <span className={styles.detailLabel}>რეგისტრაციის თარიღი</span>
            <span className={styles.detailValue}>
              {new Date(session.user.createdAt).toLocaleDateString("ka-GE")}
            </span>
          </article>
        </section>
      </main>
    </div>
  );
}
