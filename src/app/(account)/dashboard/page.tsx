import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "./Dashboard.module.scss";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";

  const adminStats = isAdmin
    ? await Promise.all([
        prisma.clinic.count({ where: { isApproved: false } }),
        prisma.user.count({ where: { accountType: "PATIENT" } }),
        prisma.clinic.count(),
      ])
    : null;

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
            <span className={styles.accountType}>
              {session.user.accountType}
            </span>
          </article>
        </section>

        {isAdmin && adminStats && (
          <>
            <section
              className={styles.details}
              aria-label="საიტის სტატისტიკა"
            >
              <Link
                href="/admin/clinics"
                className={`${styles.detailCard} ${styles.statLink}`}
              >
                <span className={styles.detailLabel}>
                  დასამტკიცებელი კლინიკები
                </span>
                <span className={styles.detailValue}>{adminStats[0]}</span>
              </Link>

              <Link
                href="/patient-profiles"
                className={`${styles.detailCard} ${styles.statLink}`}
              >
                <span className={styles.detailLabel}>
                  რეგისტრირებული პაციენტები
                </span>
                <span className={styles.detailValue}>{adminStats[1]}</span>
              </Link>

              <Link
                href="/admin/clinics"
                className={`${styles.detailCard} ${styles.statLink}`}
              >
                <span className={styles.detailLabel}>
                  რეგისტრირებული კლინიკები
                </span>
                <span className={styles.detailValue}>{adminStats[2]}</span>
              </Link>
            </section>

            <Link href="/admin/clinics">კლინიკების მართვა</Link>
          </>
        )}
      </main>
    </div>
  );
}
