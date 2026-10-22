import { prisma } from "@/lib/prisma";
import { todayRange } from "@/lib/slots";
import styles from "../../Account.module.scss";
import StatCard from "./StatCard";

// კლინიკის მიმოხილვა — სტატუსი, ექიმები, ვიზიტები
export default async function ClinicOverview({ clinicId }: { clinicId: string }) {
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });

  if (!clinic) {
    return (
      <p className={styles.detailCard}>კლინიკის მონაცემები ვერ მოიძებნა. დაასრულე რეგისტრაცია.</p>
    );
  }

  const now = new Date();
  const { todayStart, tomorrowStart } = todayRange();

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
        <StatCard href="/my-clinic" label="ექიმები" value={doctorCount} />
        <StatCard href="/my-clinic" label="ახალი ექიმების მოთხოვნები" value={pendingDoctorCount} />
        <StatCard href="/my-clinic" label="დღევანდელი ვიზიტები" value={todayCount} />
        <StatCard href="/my-clinic" label="მომავალი ვიზიტები" value={upcomingCount} />
      </section>
    </>
  );
}
