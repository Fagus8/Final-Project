import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/slots";
import styles from "../../Account.module.scss";
import StatCard from "./StatCard";

// პაციენტის ჯანმრთელობის მიმოხილვა — შემდეგი ვიზიტი, სისხლის ჯგუფი, ვიზიტების რაოდენობა
export default async function PatientOverview({ patientId }: { patientId: string }) {
  const now = new Date();
  // ოთხი მოთხოვნა ერთდროულად: სისხლის ჯგუფი, შემდეგი ვიზიტი, მომავალი და
  // ჩატარებული ვიზიტების რაოდენობა
  const [patient, nextAppointment, upcomingCount, completedCount] = await Promise.all([
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
  ]);

  return (
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

      <StatCard href="/my-appointments" label="მომავალი ვიზიტები" value={upcomingCount} />
      <StatCard href="/my-appointments" label="ჩატარებული ვიზიტები" value={completedCount} />
    </section>
  );
}
