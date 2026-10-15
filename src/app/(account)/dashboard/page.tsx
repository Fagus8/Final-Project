import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/layout/Sidebar";
import ClinicOverview from "./_components/ClinicOverview";
import DoctorOverview from "./_components/DoctorOverview";
import PatientOverview from "./_components/PatientOverview";
import styles from "../Account.module.scss";

// თითოეული როლისთვის მისალმების ტექსტი და მთავარი გვერდი
const roleIntro: Record<string, { text: string; link?: { href: string; label: string } }> = {
  PATIENT: { text: "აქ ნახავ შენს ვიზიტებს, დიაგნოზებს და დანიშნულებებს." },
  DOCTOR: {
    text: "აქ ნახავ შენს დღევანდელ და მომავალ პაციენტებს.",
    link: { href: "/my-schedule", label: "ჩემი განრიგი" },
  },
  CLINIC: {
    text: "აქ ნახავ კლინიკის ექიმებსა და ვიზიტებს.",
    link: { href: "/my-clinic", label: "კლინიკის მართვა" },
  },
};

// პირადი კაბინეტი. ყველა როლს თავისი შიგთავსი აქვს:
// პაციენტს — ჯანმრთელობა, ექიმს — პაციენტები, კლინიკას — ექიმები და ვიზიტები,
// ადმინს — საიტის სტატისტიკა
export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "admin";
  const accountType = session.user.accountType;

  // ადმინის სტატისტიკა: დასამტკიცებელი კლინიკები, პაციენტები, ყველა კლინიკა.
  // Promise.all სამივე მოთხოვნას ერთდროულად აგზავნის
  const adminStats = isAdmin
    ? await Promise.all([
        prisma.clinic.count({ where: { isApproved: false } }),
        prisma.user.count({ where: { accountType: "PATIENT" } }),
        prisma.clinic.count(),
      ])
    : null;

  const intro = isAdmin ? null : roleIntro[accountType];

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>პირადი კაბინეტი</h1>

        <section className={styles.welcomeCard} aria-labelledby="welcome-title">
          <p className={styles.eyebrow}>მოგესალმები</p>
          <h2 className={styles.welcomeTitle} id="welcome-title">
            {session.user.name}
          </h2>
          <p className={styles.welcomeText}>
            {intro?.text ?? "აქ შეგიძლია საიტის მართვა."}
          </p>
          {intro?.link && (
            <Link href={intro.link.href} className={styles.quickLink}>
              {intro.link.label} →
            </Link>
          )}
        </section>

        {!isAdmin && accountType === "PATIENT" && <PatientOverview patientId={session.user.id} />}
        {!isAdmin && accountType === "DOCTOR" && <DoctorOverview userId={session.user.id} />}
        {!isAdmin && accountType === "CLINIC" && <ClinicOverview clinicId={session.user.id} />}

        {isAdmin && adminStats && (
          <>
            <section className={styles.details} aria-label="ანგარიშის ინფორმაცია">
              <article className={styles.detailCard}>
                <span className={styles.detailLabel}>ელფოსტა</span>
                <span className={styles.detailValue}>{session.user.email}</span>
              </article>

              <article className={styles.detailCard}>
                <span className={styles.detailLabel}>ანგარიშის ტიპი</span>
                <span className={styles.accountType}>ადმინისტრატორი</span>
              </article>
            </section>

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
                href="/admin/patients"
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
