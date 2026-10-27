import { redirect } from "next/navigation";
import DoctorSettingsForm from "@/components/doctors/DoctorSettingsForm";
import DoctorStatusNotice from "@/components/doctors/DoctorStatusNotice";
import Sidebar from "@/components/navigation/Sidebar";
import { cancellationText } from "@/lib/appointment-status";
import { loginUrl } from "@/lib/next-url";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDateTime, formatDay, formatTime } from "@/lib/time";
import JoinClinicForm from "./_components/JoinClinicForm";
import DoctorAppointments from "./_components/DoctorAppointments";
import styles from "../Staff.module.scss";

// ექიმის გვერდი „ჩემი განრიგი“. ოთხი მდგომარეობა აქვს:
// 1) ექიმი ჯერ არცერთ კლინიკას არ უკავშირდება — კლინიკის არჩევის ფორმა
// 2) კლინიკამ მოთხოვნა უარყო ან ექიმი მოხსნა — შეტყობინება და კლინიკის არჩევის ფორმა
// 3) მოთხოვნა გაგზავნილია, კლინიკას ჯერ არ დაუდასტურებია — ლოდინის შეტყობინება
// 4) დადასტურებულია — სამუშაო გრაფიკი და ვიზიტების კალენდარი
// (პროფილის ინფორმაცია ცალკე გვერდზეა — „ჩემი პროფილი“, /doctor-profile)
export default async function DoctorSchedulePage({ searchParams }: PageProps<"/doctor-schedule">) {
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
      clinic: true,
      appointments: {
        include: { patient: { include: { patient: { select: { phone: true } } } } },
        orderBy: { startsAt: "asc" },
      },
    },
  });

  // 1-2) კლინიკა ჯერ არ აურჩევია, ან კლინიკამ უარყო / მოხსნა
  if (!doctor || doctor.rejectedAt || doctor.removedAt) {
    // რეგისტრაციისას შეყვანილი სპეციალობა და გამოცდილება URL-ით მოდის,
    // ან წინა მოთხოვნიდან აიღება
    const { specialty, experience } = await searchParams;
    const defaults = {
      specialty: typeof specialty === "string" ? specialty : (doctor?.specialty ?? ""),
      experienceYears: Math.max(0, Math.trunc(Number(experience ?? doctor?.experienceYears)) || 0),
    };
    const clinics = await prisma.clinic.findMany({
      where: { isApproved: true },
      select: { id: true, name: true, city: true },
      orderBy: { name: "asc" },
    });

    return (
      <div className={styles.page}>
        <Sidebar />
        <main className={styles.main}>
          <h1 className={styles.title}>ჩემი განრიგი</h1>
          <section className={styles.card}>
            <h2>აირჩიე კლინიკა</h2>
            <p>
              <DoctorStatusNotice doctor={doctor} showLink={false} /> შეავსე ფორმა და კლინიკა
              დაადასტურებს მოთხოვნას.
            </p>
            <h3>ექიმის მონაცემები</h3>
            <JoinClinicForm clinics={clinics} defaults={defaults} />
          </section>
        </main>
      </div>
    );
  }

  // 3) კლინიკის დადასტურებას ელოდება
  if (!doctor.isApproved) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <main className={styles.main}>
          <h1 className={styles.title}>ჩემი განრიგი</h1>
          <p className={styles.card}>
            <DoctorStatusNotice doctor={doctor} />
          </p>
        </main>
      </div>
    );
  }

  // 4) კალენდრისთვის ვიზიტებს მარტივ ობიექტებად ვამზადებთ (კლიენტის
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

        <section className={styles.card}>
          <h2>{doctor.name}</h2>
          <p>
            {doctor.specialty} · {doctor.clinic.name}
            {doctor.room && <> · კაბინეტი {doctor.room}</>}
          </p>
          <h3>სამუშაო გრაფიკი</h3>
          <DoctorSettingsForm
            doctor={{
              id: doctor.id,
              workStart: doctor.workStart,
              workEnd: doctor.workEnd,
              workDays: doctor.workDays,
              daysOff: doctor.daysOff,
              room: doctor.room,
            }}
          />
        </section>

        <DoctorAppointments items={items} today={formatDay(new Date())} />
      </main>
    </div>
  );
}
