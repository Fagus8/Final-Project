import Link from "next/link";
import { redirect } from "next/navigation";
import Sidebar from "@/components/navigation/Sidebar";
import { cancellationText } from "@/lib/appointment-status";
import { loginUrl } from "@/lib/next-url";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDateTime, formatDay, formatTime } from "@/lib/time";
import DoctorAppointments from "./_components/DoctorAppointments";
import styles from "../Staff.module.scss";

// ექიმის გვერდი „ჩემი განრიგი“ — ვიზიტების კალენდარი ყველა კლინიკიდან.
// სამუშაო გრაფიკი, კლინიკების არჩევა და პროფილი „ჩემ პროფილშია“ (/doctor-profile)
export default async function DoctorSchedulePage() {
  const session = await getSession();

  if (!session) {
    redirect(loginUrl("/doctor-schedule"));
  }

  if (session.user.accountType !== "DOCTOR") {
    redirect("/dashboard");
  }

  // ექიმის ჩანაწერი ანგარიშს userId-ით უკავშირდება, ვიზიტებთან და პაციენტებთან ერთად
  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    include: {
      clinics: { where: { isApproved: true }, select: { clinicId: true, isApproved: true } },
      appointments: {
        include: { patient: { include: { patient: { select: { phone: true } } } } },
        orderBy: { startsAt: "asc" },
      },
    },
  });

  const approved = doctor?.clinics.filter((item) => item.isApproved) ?? [];

  // არცერთ კლინიკას ჯერ არ დაუდასტურებია — მდგომარეობა და კლინიკის არჩევა „ჩემ პროფილშია“
  if (!doctor || approved.length === 0) {
    redirect("/doctor-profile");
  }

  // კალენდრისთვის ვიზიტებს მარტივ ობიექტებად ვამზადებთ (კლიენტის
  // კომპონენტს Date ობიექტი კი არა, მზა ტექსტი გადაეცემა)
  const now = new Date();
  const items = doctor.appointments.map((appointment) => {
    // ამ პაციენტის წინა დასრულებული ვიზიტები ამ ექიმთან, ბოლო პირველი
    const previous = doctor.appointments
      .filter(
        (other) =>
          other.patientId === appointment.patientId &&
          other.status === "COMPLETED" &&
          other.startsAt < appointment.startsAt,
      )
      .reverse();

    return {
      id: appointment.id,
      day: formatDay(appointment.startsAt),
      time: formatTime(appointment.startsAt),
      status: appointment.status,
      patientName: appointment.patient.name,
      patientEmail: appointment.patient.email,
      patientPhone: appointment.patient.patient?.phone ?? null,
      // ერთ კლინიკაში მომუშავე ექიმს კლინიკის სახელი ყველა ვიზიტზე არ სჭირდება
      clinicName: approved.length > 1 ? appointment.clinicName : null,
      diagnosis: appointment.diagnosis,
      prescription: appointment.prescription,
      cancelText:
        appointment.status === "CANCELLED"
          ? cancellationText(appointment.cancelledBy, appointment.cancelReason)
          : null,
      hasStarted: appointment.startsAt <= now,
      previousVisits: previous.length,
      // ბოლო სამი დიაგნოზი, რომ ექიმმა პაციენტის ისტორია ნახოს
      previousDiagnoses: previous
        .filter((other) => other.diagnosis)
        .slice(0, 3)
        .map((other) => ({ date: formatDateTime(other.startsAt), diagnosis: other.diagnosis! })),
    };
  });

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>ჩემი განრიგი</h1>

        <p className={styles.card}>
          სამუშაო გრაფიკის შეცვლა და სხვა კლინიკასთან მოთხოვნა —{" "}
          <Link href="/doctor-profile">ჩემ პროფილში →</Link>
        </p>

        <DoctorAppointments items={items} today={formatDay(new Date())} />
      </main>
    </div>
  );
}
