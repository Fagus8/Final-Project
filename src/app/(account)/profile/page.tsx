import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/layout/Sidebar";
import styles from "../Account.module.scss";

// პაციენტის პროფილი: ანგარიშის მონაცემები (ჯანმრთელობის ინფორმაცია
// პირად კაბინეტშია)
export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // გვერდი მხოლოდ პაციენტისთვისაა
  if (session.user.accountType !== "PATIENT" || session.user.role === "admin") {
    redirect("/dashboard");
  }

  // ტელეფონი და სისხლის ჯგუფი; რეგისტრაციამდე შექმნილ ანგარიშს შეიძლება არ ჰქონდეს
  const patient = await prisma.patient.findUnique({ where: { id: session.user.id } });

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
            <span className={styles.detailLabel}>სისხლის ჯგუფი</span>
            <span className={styles.detailValue}>{patient?.bloodType ?? "უცნობია"}</span>
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
