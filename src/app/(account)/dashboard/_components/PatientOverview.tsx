import Link from "next/link";
import list from "@/components/ui/List.module.scss";
import { cancellationText } from "@/lib/appointment-status";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/time";
import styles from "../../Account.module.scss";
import StatCard from "./StatCard";

// პაციენტის ჯანმრთელობის მიმოხილვა — შემდეგი ვიზიტი, სისხლის ჯგუფი, ვიზიტების რაოდენობა
// და ცვლილებები: ვიზიტები, რომლებიც ექიმმა ან კლინიკამ გააუქმა
export default async function PatientOverview({ patientId }: { patientId: string }) {
  const now = new Date();
  // ხუთი მოთხოვნა ერთდროულად: სისხლის ჯგუფი, შემდეგი ვიზიტი, მომავალი და
  // ჩატარებული ვიზიტების რაოდენობა, სხვის მიერ გაუქმებული მომავალი ვიზიტები
  const [patient, nextAppointment, upcomingCount, completedCount, cancelledByOthers] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId }, select: { bloodType: true } }),
    prisma.appointment.findFirst({
      where: { patientId, status: "BOOKED", startsAt: { gte: now } },
      orderBy: { startsAt: "asc" },
    }),
    prisma.appointment.count({
      where: { patientId, status: "BOOKED", startsAt: { gte: now } },
    }),
    prisma.appointment.count({ where: { patientId, status: "COMPLETED" } }),
    prisma.appointment.findMany({
      where: {
        patientId,
        status: "CANCELLED",
        cancelledBy: { not: "PATIENT" },
        startsAt: { gte: now },
      },
      orderBy: { startsAt: "asc" },
    }),
  ]);

  return (
    <>
      {cancelledByOthers.length > 0 && (
        <section className={styles.alertCard} aria-labelledby="changes-title">
          <h2 id="changes-title">ცვლილებები შენს ვიზიტებში</h2>
          <ul>
            {cancelledByOthers.map((appointment) => (
              <li key={appointment.id}>
                <strong>{formatDateTime(appointment.startsAt)}</strong> · {appointment.doctorName},{" "}
                {appointment.clinicName}
                <span className={list.cancelInfo}>
                  {" "}— {cancellationText(appointment.cancelledBy, appointment.cancelReason)}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/booking">დაჯავშნე ახალი დრო →</Link>
        </section>
      )}

      <section className={styles.details} aria-label="ჯანმრთელობის მიმოხილვა">
        <article className={styles.detailCard}>
          <span className={styles.detailLabel}>შემდეგი ვიზიტი</span>
          {nextAppointment ? (
            <>
              <span className={styles.detailValue}>
                {formatDateTime(nextAppointment.startsAt)}
              </span>
              <span className={styles.detailLabel}>
                {nextAppointment.doctorName} · {nextAppointment.doctorSpecialty},{" "}
                {nextAppointment.clinicName}
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

        <StatCard href="/patient-visits" label="მომავალი ვიზიტები" value={upcomingCount} />
        <StatCard href="/patient-visits" label="ჩატარებული ვიზიტები" value={completedCount} />
      </section>
    </>
  );
}
