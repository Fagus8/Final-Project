import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatDay, formatTime, todayRange } from "@/lib/slots";
import styles from "../../Account.module.scss";
import StatCard from "./StatCard";

// ექიმის სამუშაო დღის მიმოხილვა — დღევანდელი და მომავალი პაციენტები
export default async function DoctorOverview({ userId }: { userId: string }) {
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    include: { clinic: true },
  });

  // ექიმი ჯერ არცერთ კლინიკას არ უკავშირდება
  if (!doctor) {
    return (
      <p className={styles.detailCard}>
        შენი ანგარიში ჯერ არცერთ კლინიკას არ უკავშირდება.{" "}
        <Link href="/my-schedule">აირჩიე კლინიკა →</Link>
      </p>
    );
  }

  if (!doctor.isApproved) {
    return (
      <p className={styles.detailCard}>
        შენი მოთხოვნა გაგზავნილია კლინიკაში <strong>{doctor.clinic.name}</strong> და
        დადასტურებას ელოდება.
      </p>
    );
  }

  const now = new Date();
  const { todayStart, tomorrowStart } = todayRange();

  // ოთხი მოთხოვნა ერთდროულად: დღევანდელი ვიზიტები, შემდეგი პაციენტი,
  // მომავალი ვიზიტები და ნამკურნალები პაციენტები (groupBy — თითო პაციენტი ერთხელ)
  const [todayCount, nextAppointment, upcomingCount, patientGroups] = await Promise.all([
    prisma.appointment.count({
      where: {
        doctorId: doctor.id,
        status: "BOOKED",
        startsAt: { gte: todayStart, lt: tomorrowStart },
      },
    }),
    prisma.appointment.findFirst({
      where: { doctorId: doctor.id, status: "BOOKED", startsAt: { gte: now } },
      include: { patient: true },
      orderBy: { startsAt: "asc" },
    }),
    prisma.appointment.count({
      where: { doctorId: doctor.id, status: "BOOKED", startsAt: { gte: now } },
    }),
    prisma.appointment.groupBy({
      by: ["patientId"],
      where: { doctorId: doctor.id, status: "COMPLETED" },
    }),
  ]);

  return (
    <>
      <section className={styles.details} aria-label="სამუშაო ინფორმაცია">
        <article className={styles.detailCard}>
          <span className={styles.detailLabel}>კლინიკა</span>
          <span className={styles.detailValue}>{doctor.clinic.name}</span>
          <span className={styles.detailLabel}>
            {doctor.specialty}
            {doctor.room && <> · კაბინეტი {doctor.room}</>} · {doctor.workStart}–{doctor.workEnd}
          </span>
        </article>

        <article className={styles.detailCard}>
          <span className={styles.detailLabel}>შემდეგი პაციენტი</span>
          {nextAppointment ? (
            <>
              <span className={styles.detailValue}>{nextAppointment.patient.name}</span>
              <span className={styles.detailLabel}>
                {formatDay(nextAppointment.startsAt) === formatDay(now)
                  ? `დღეს, ${formatTime(nextAppointment.startsAt)}`
                  : formatDateTime(nextAppointment.startsAt)}
              </span>
            </>
          ) : (
            <span className={styles.detailValue}>ჩაწერილი პაციენტი არ არის</span>
          )}
        </article>
      </section>

      <section className={styles.details} aria-label="ვიზიტების სტატისტიკა">
        <StatCard href="/my-schedule" label="დღევანდელი ვიზიტები" value={todayCount} />
        <StatCard href="/my-schedule" label="მომავალი ვიზიტები" value={upcomingCount} />
        <StatCard href="/my-schedule" label="ნამკურნალები პაციენტები" value={patientGroups.length} />
      </section>
    </>
  );
}
