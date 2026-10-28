import Link from "next/link";
import { redirect } from "next/navigation";
import Sidebar from "@/components/navigation/Sidebar";
import { loginUrl } from "@/lib/next-url";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import ClinicOverview from "./_components/ClinicOverview";
import PatientOverview from "./_components/PatientOverview";
import StatCard from "./_components/StatCard";
import styles from "../Account.module.scss";

// თითოეული როლისთვის მისალმების ტექსტი და მთავარი გვერდი
const roleIntro: Record<string, { text: string; link?: { href: string; label: string } }> = {
  PATIENT: { text: "აქ ნახავ შენს ვიზიტებს, დიაგნოზებს და დანიშნულებებს." },
  CLINIC: {
    text: "აქ ნახავ კლინიკის ექიმებსა და ვიზიტებს.",
    link: { href: "/manage-clinic", label: "კლინიკის მართვა" },
  },
};

// პირადი კაბინეტი. ყველა როლს თავისი შიგთავსი აქვს:
// პაციენტს — ჯანმრთელობა, კლინიკას — ექიმები და ვიზიტები, ადმინს — საიტის სტატისტიკა.
// ექიმის კაბინეტი „ჩემ პროფილშია“ (/doctor-profile)
export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const session = await getSession();

  if (!session) {
    redirect(loginUrl("/dashboard"));
  }

  const isAdmin = session.user.role === "admin";
  const accountType = session.user.accountType;

  // ექიმი პირდაპირ „ჩემ პროფილზე“ გადადის; რეგისტრაციის მონაცემები (?specialty=...) თან მიაქვს
  if (accountType === "DOCTOR" && !isAdmin) {
    const query = new URLSearchParams(
      Object.entries(await searchParams).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    ).toString();
    redirect(query ? `/doctor-profile?${query}` : "/doctor-profile");
  }
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

        {isAdmin ? (
          <AdminOverview email={session.user.email} />
        ) : (
          <>
            {accountType === "PATIENT" && <PatientOverview patientId={session.user.id} />}
            {accountType === "CLINIC" && <ClinicOverview clinicId={session.user.id} />}
          </>
        )}
      </main>
    </div>
  );
}

// ადმინის სტატისტიკა: დასამტკიცებელი კლინიკები, პაციენტები, ყველა კლინიკა.
// Promise.all სამივე მოთხოვნას ერთდროულად აგზავნის
async function AdminOverview({ email }: { email: string }) {
  const [pendingClinicCount, patientCount, clinicCount] = await Promise.all([
    prisma.clinic.count({ where: { isApproved: false } }),
    prisma.user.count({ where: { accountType: "PATIENT" } }),
    prisma.clinic.count(),
  ]);

  return (
    <>
      <section className={styles.details} aria-label="ანგარიშის ინფორმაცია">
        <article className={styles.detailCard}>
          <span className={styles.detailLabel}>ელფოსტა</span>
          <span className={styles.detailValue}>{email}</span>
        </article>

        <article className={styles.detailCard}>
          <span className={styles.detailLabel}>ანგარიშის ტიპი</span>
          <span className={styles.accountType}>ადმინისტრატორი</span>
        </article>
      </section>

      <section className={styles.details} aria-label="საიტის სტატისტიკა">
        <StatCard href="/admin/clinics" label="დასამტკიცებელი კლინიკები" value={pendingClinicCount} />
        <StatCard href="/admin/patients" label="რეგისტრირებული პაციენტები" value={patientCount} />
        <StatCard href="/admin/clinics" label="რეგისტრირებული კლინიკები" value={clinicCount} />
      </section>

      <Link href="/admin/clinics">კლინიკების მართვა</Link>
    </>
  );
}
