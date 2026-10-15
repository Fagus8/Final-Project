import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import DoctorProfileForm from "@/components/doctors/DoctorProfileForm";
import DoctorScheduleForm from "@/components/doctors/DoctorScheduleForm";
import Sidebar from "@/components/layout/Sidebar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDay, formatTime } from "@/lib/slots";
import JoinClinicForm from "./_components/JoinClinicForm";
import DoctorSchedule from "./_components/DoctorSchedule";
import styles from "../Staff.module.scss";

// ექიმის გვერდი „ჩემი განრიგი“. სამი მდგომარეობა აქვს:
// 1) ექიმი ჯერ არცერთ კლინიკას არ უკავშირდება — კლინიკის არჩევის ფორმა
// 2) მოთხოვნა გაგზავნილია, კლინიკას ჯერ არ დაუდასტურებია — ლოდინის შეტყობინება
// 3) დადასტურებულია — სამუშაო საათები, პროფილი და ვიზიტების კალენდარი
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

  // ექიმის ჩანაწერი ანგარიშს userId-ით უკავშირდება, ვიზიტებთან და პაციენტებთან ერთად
  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    include: {
      clinic: true,
      appointments: {
        include: { patient: true },
        orderBy: { startsAt: "asc" },
      },
    },
  });

  // 1) კლინიკა ჯერ არ აურჩევია: ვაჩვენებთ დამტკიცებულ კლინიკებს
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

  // 2) კლინიკის დადასტურებას ელოდება
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

  // 3) კალენდრისთვის ვიზიტებს მარტივ ობიექტებად ვამზადებთ (კლიენტის
  // კომპონენტს Date ობიექტი კი არა, მზა ტექსტი გადაეცემა)
  const now = new Date();
  const items = doctor.appointments.map((appointment) => ({
    id: appointment.id,
    day: formatDay(appointment.startsAt),
    time: formatTime(appointment.startsAt),
    status: appointment.status,
    patientName: appointment.patient.name,
    patientEmail: appointment.patient.email,
    diagnosis: appointment.diagnosis,
    prescription: appointment.prescription,
    hasStarted: appointment.startsAt <= now,
    // რამდენჯერ ყოფილა ეს პაციენტი ამ ექიმთან ამ ვიზიტამდე
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

        <section className={styles.card}>
          <h2>ჩემი პროფილი</h2>
          <p>
            ეს ინფორმაცია ჩანს შენს{" "}
            <Link href={`/doctors/${doctor.id}`}>საჯარო პროფილზე</Link>.
          </p>
          <h3>პროფილის ინფორმაცია</h3>
          <DoctorProfileForm
            doctor={{
              id: doctor.id,
              name: doctor.name,
              specialty: doctor.specialty,
              experienceYears: doctor.experienceYears,
              avatarUrl: doctor.avatarUrl,
              bio: doctor.bio,
              education: doctor.education,
              languages: doctor.languages,
              services: doctor.services,
              consultationFee: doctor.consultationFee,
            }}
          />
        </section>

        <DoctorSchedule items={items} today={formatDay(new Date())} />
      </main>
    </div>
  );
}
