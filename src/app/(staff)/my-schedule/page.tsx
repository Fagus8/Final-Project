import { redirect } from "next/navigation";
import DoctorScheduleForm from "@/components/doctors/DoctorScheduleForm";
import Sidebar from "@/components/layout/Sidebar";
import { findDoctorInvitation } from "@/lib/doctors";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDay, formatTime } from "@/lib/slots";
import AcceptInvitationButton from "./_components/AcceptInvitationButton";
import JoinClinicForm from "./_components/JoinClinicForm";
import DoctorSchedule from "./_components/DoctorSchedule";
import styles from "../Staff.module.scss";

// ექიმის გვერდი „ჩემი განრიგი“. სამი მდგომარეობა აქვს:
// 1) ექიმი ჯერ არცერთ კლინიკას არ უკავშირდება — მოწვეულს მოწვევის მიღება,
//    დანარჩენს კლინიკის არჩევის ფორმა
// 2) მოთხოვნა გაგზავნილია, კლინიკას ჯერ არ დაუდასტურებია — ლოდინის შეტყობინება
// 3) დადასტურებულია — სამუშაო საათები და ვიზიტების კალენდარი
// (პროფილის ინფორმაცია ცალკე გვერდზეა — „ჩემი პროფილი“, /my-profile)
export default async function MySchedulePage({ searchParams }: PageProps<"/my-schedule">) {
  const session = await getSession();

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

  // 1) ექიმი ჯერ არცერთ კლინიკას არ უკავშირდება
  if (!doctor) {
    // მოწვეულს კლინიკის არჩევა არ სჭირდება — მხოლოდ მოწვევის მიღება
    const invitation = await findDoctorInvitation(session.user.email);
    if (invitation) {
      return (
        <div className={styles.page}>
          <Sidebar />
          <main className={styles.main}>
            <h1 className={styles.title}>ჩემი განრიგი</h1>
            <section className={styles.card}>
              <h2>მოწვევა კლინიკიდან</h2>
              <p>
                კლინიკამ <strong>{invitation.clinic.name}</strong> დაგამატა ექიმად. მიიღე მოწვევა
                და კლინიკა დაადასტურებს მოთხოვნას.
              </p>
              <AcceptInvitationButton />
            </section>
          </main>
        </div>
      );
    }

    // მოწვევის გარეშე — ექიმი თავად ირჩევს დამტკიცებულ კლინიკას.
    // რეგისტრაციისას შეყვანილი სპეციალობა და გამოცდილება URL-ით მოდის
    const { specialty, experience } = await searchParams;
    const defaults = {
      specialty: typeof specialty === "string" ? specialty : "",
      experienceYears: Math.max(0, Math.trunc(Number(experience)) || 0),
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
              შენი ანგარიში ჯერ არცერთ კლინიკას არ უკავშირდება. შეავსე ფორმა და
              კლინიკა დაადასტურებს მოთხოვნას.
            </p>
            <h3>ექიმის მონაცემები</h3>
            <JoinClinicForm clinics={clinics} defaults={defaults} />
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

        <DoctorSchedule items={items} today={formatDay(new Date())} />
      </main>
    </div>
  );
}
