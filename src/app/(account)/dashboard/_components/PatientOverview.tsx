import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/slots";
import styles from "../../Account.module.scss";

// პაციენტის ჯანმრთელობის მიმოხილვა — ვიზიტები, დიაგნოზი, დანიშნულება
export default async function PatientOverview({ patientId }: { patientId: string }) {
  const now = new Date();
  // ხუთი მოთხოვნა ერთდროულად: სისხლის ჯგუფი, შემდეგი ვიზიტი, მომავალი და
  // ჩატარებული ვიზიტების რაოდენობა, ბოლო ვიზიტი დიაგნოზით
  const [patient, nextAppointment, upcomingCount, completedCount, lastRecord] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId }, select: { bloodType: true } }),
    prisma.appointment.findFirst({
      where: { patientId, status: "BOOKED", startsAt: { gte: now } },
      include: { doctor: { include: { clinic: true } } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.appointment.count({
      where: { patientId, status: "BOOKED", startsAt: { gte: now } },
    }),
    prisma.appointment.count({ where: { patientId, status: "COMPLETED" } }),
    prisma.appointment.findFirst({
      where: { patientId, diagnosis: { not: null } },
      include: { doctor: true },
      orderBy: { startsAt: "desc" },
    }),
  ]);

  return (
    <>
      <section className={styles.details} aria-label="ჯანმრთელობის მიმოხილვა">
        <article className={styles.detailCard}>
          <span className={styles.detailLabel}>შემდეგი ვიზიტი</span>
          {nextAppointment ? (
            <>
              <span className={styles.detailValue}>
                {formatDateTime(nextAppointment.startsAt)}
              </span>
              <span className={styles.detailLabel}>
                {nextAppointment.doctor.name} · {nextAppointment.doctor.specialty},{" "}
                {nextAppointment.doctor.clinic.name}
              </span>
            </>
          ) : (
            <span className={styles.detailValue}>დაგეგმილი ვიზიტი არ გაქვს</span>
          )}
        </article>

        <article className={styles.detailCard}>
          <span className={styles.detailLabel}>სისხლის ჯგუფი</span>
          <span className={styles.detailValue}>{patient?.bloodType ?? "უცნობია"}</span>
        </article>

        <Link href="/my-appointments" className={`${styles.detailCard} ${styles.statLink}`}>
          <span className={styles.detailLabel}>მომავალი ვიზიტები</span>
          <span className={styles.detailValue}>{upcomingCount}</span>
        </Link>

        <Link href="/my-appointments" className={`${styles.detailCard} ${styles.statLink}`}>
          <span className={styles.detailLabel}>ჩატარებული ვიზიტები</span>
          <span className={styles.detailValue}>{completedCount}</span>
        </Link>
      </section>

      {/* ბოლო დიაგნოზი ჩანს მხოლოდ მაშინ, თუ ექიმს უკვე ჩაუწერია */}
      {lastRecord && (
        <section className={styles.details} aria-label="ბოლო დიაგნოზი">
          <article className={styles.detailCard}>
            <span className={styles.detailLabel}>
              ბოლო დიაგნოზი · {formatDateTime(lastRecord.startsAt)}, {lastRecord.doctor.name}
            </span>
            <span className={styles.detailValue}>{lastRecord.diagnosis}</span>
            {lastRecord.prescription && (
              <span>
                <strong>დანიშნულება:</strong> {lastRecord.prescription}
              </span>
            )}
          </article>
        </section>
      )}
    </>
  );
}
