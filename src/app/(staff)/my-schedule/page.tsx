import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DoctorScheduleForm from "@/components/doctors/DoctorScheduleForm";
import Sidebar from "@/components/layout/Sidebar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDay, formatTime } from "@/lib/slots";
import JoinClinicForm from "./_components/JoinClinicForm";
import DoctorSchedule from "./_components/DoctorSchedule";
import styles from "../Staff.module.scss";

export default async function MySchedulePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.user.accountType !== "DOCTOR") {
    redirect("/dashboard");
  }

  // ექიმს ვპოულობთ ანგარიშის ელფოსტით
  const doctor = await prisma.doctor.findUnique({
    where: { email: session.user.email },
    include: {
      clinic: true,
      appointments: {
        include: { patient: true },
        orderBy: { startsAt: "asc" },
      },
    },
  });

  if (!doctor) {
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
              შენი ანგარიში ჯერ არცერთ კლინიკას არ უკავშირდება. შეავსე ფორმა და
              კლინიკა დაადასტურებს მოთხოვნას.
            </p>
            <h3>ექიმის მონაცემები</h3>
            <JoinClinicForm clinics={clinics} />
          </section>
        </main>
      </div>
    );
  }

  if (!doctor.isApproved) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <main className={styles.main}>
          <h1 className={styles.title}>ჩემი განრიგი</h1>
          <p className={styles.card}>
            შენი მოთხოვნა გაგზავნილია კლინიკაში <strong>{doctor.clinic.name}</strong>.
            დადასტურების შემდეგ აქ გამოჩნდება შენი განრიგი და პაციენტები.
          </p>
        </main>
      </div>
    );
  }

  const items = doctor.appointments.map((appointment) => ({
    id: appointment.id,
    day: formatDay(appointment.startsAt),
    time: formatTime(appointment.startsAt),
    status: appointment.status,
    patientName: appointment.patient.name,
    patientEmail: appointment.patient.email,
    diagnosis: appointment.diagnosis,
    prescription: appointment.prescription,
    previousVisits: doctor.appointments.filter(
      (other) =>
        other.patientId === appointment.patientId &&
        other.status === "COMPLETED" &&
        other.startsAt < appointment.startsAt,
    ).length,
  }));

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
          <h3>სამუშაო საათები (ორშაბათი–შაბათი)</h3>
          <DoctorScheduleForm
            doctor={{
              id: doctor.id,
              workStart: doctor.workStart,
              workEnd: doctor.workEnd,
              email: doctor.email,
              room: doctor.room,
            }}
          />
        </section>

        <DoctorSchedule items={items} today={formatDay(new Date())} />
      </main>
    </div>
  );
}
