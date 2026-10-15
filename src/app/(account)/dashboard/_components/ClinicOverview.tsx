import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDay, toDate } from "@/lib/slots";
import styles from "../../Account.module.scss";

// კლინიკის მიმოხილვა — სტატუსი, ექიმები, ვიზიტები
export default async function ClinicOverview({ clinicId }: { clinicId: string }) {
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });

  if (!clinic) {
    return (
      <p className={styles.detailCard}>კლინიკის მონაცემები ვერ მოიძებნა. დაასრულე რეგისტრაცია.</p>
    );
  }

  const now = new Date();
  // დღის საზღვრები თბილისის დროით
  const todayStart = toDate(formatDay(now), "00:00");
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const [doctorCount, pendingDoctorCount, todayCount, upcomingCount] = await Promise.all([
    prisma.doctor.count({ where: { clinicId, isApproved: true } }),
    // ექიმები, რომლებიც თვითონ დარეგისტრირდნენ და დადასტურებას ელოდებიან
    prisma.doctor.count({ where: { clinicId, isApproved: false, userId: { not: null } } }),
    prisma.appointment.count({
      where: {
        doctor: { clinicId },
        status: "BOOKED",
        startsAt: { gte: todayStart, lt: tomorrowStart },
      },
    }),
    prisma.appointment.count({
      where: { doctor: { clinicId }, status: "BOOKED", startsAt: { gte: now } },
    }),
  ]);

  return (
    <>
      <section className={styles.details} aria-label="კლინიკის ინფორმაცია">
        <article className={styles.detailCard}>
          <span className={styles.detailLabel}>კლინიკა</span>
          <span className={styles.detailValue}>{clinic.name}</span>
          <span className={styles.detailLabel}>
            {clinic.city}, {clinic.address} · {clinic.phone}
          </span>
        </article>

        <article className={styles.detailCard}>
          <span className={styles.detailLabel}>სტატუსი</span>
          <span className={styles.accountType}>
            {clinic.isApproved ? "დამტკიცებული" : "ელოდება დამტკიცებას"}
          </span>
        </article>
      </section>

      <section className={styles.details} aria-label="კლინიკის სტატისტიკა">
        <Link href="/my-clinic" className={`${styles.detailCard} ${styles.statLink}`}>
          <span className={styles.detailLabel}>ექიმები</span>
          <span className={styles.detailValue}>{doctorCount}</span>
        </Link>

        <Link href="/my-clinic" className={`${styles.detailCard} ${styles.statLink}`}>
          <span className={styles.detailLabel}>ახალი ექიმების მოთხოვნები</span>
          <span className={styles.detailValue}>{pendingDoctorCount}</span>
        </Link>

        <Link href="/my-clinic" className={`${styles.detailCard} ${styles.statLink}`}>
          <span className={styles.detailLabel}>დღევანდელი ვიზიტები</span>
          <span className={styles.detailValue}>{todayCount}</span>
        </Link>

        <Link href="/my-clinic" className={`${styles.detailCard} ${styles.statLink}`}>
          <span className={styles.detailLabel}>მომავალი ვიზიტები</span>
          <span className={styles.detailValue}>{upcomingCount}</span>
        </Link>
      </section>
    </>
  );
}
