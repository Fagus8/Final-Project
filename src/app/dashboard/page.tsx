import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import styles from "./Dashboard.module.scss";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>პირადი კაბინეტი</h1>

        <section className={styles.welcomeCard} aria-labelledby="welcome-title">
          <p className={styles.eyebrow}>მოგესალმები</p>
          <h2 className={styles.welcomeTitle} id="welcome-title">
            {session.user.name}
          </h2>
          <p className={styles.welcomeText}>
            აქ შეგიძლია შენი ანგარიშის ინფორმაციის ნახვა.
          </p>
        </section>

        <section className={styles.details} aria-label="ანგარიშის ინფორმაცია">
          <article className={styles.detailCard}>
            <span className={styles.detailLabel}>ელფოსტა</span>
            <span className={styles.detailValue}>{session.user.email}</span>
          </article>

          <article className={styles.detailCard}>
            <span className={styles.detailLabel}>ანგარიშის ტიპი</span>
            <span className={styles.accountType}>{session.user.accountType}</span>
          </article>
        </section>
      </main>
    </div>
  );
}
