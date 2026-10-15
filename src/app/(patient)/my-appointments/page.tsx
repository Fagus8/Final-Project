import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import AppointmentActions from "@/components/appointments/AppointmentActions";
import list from "@/components/appointments/AppointmentList.module.scss";
import Sidebar from "@/components/layout/Sidebar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, statusLabels } from "@/lib/slots";
import styles from "../Patient.module.scss";

// პაციენტის გვერდი „ჩემი ვიზიტები“: მომავალი ვიზიტები და ისტორია დიაგნოზებით

// ექიმის ფოტო, ან თუ ფოტო არ აქვს, სახელის პირველი ასო
function DoctorAvatar({ doctor }: { doctor: { name: string; avatarUrl: string | null } }) {
  return doctor.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={list.avatar} src={doctor.avatarUrl} alt="" />
  ) : (
    <span className={list.avatar} aria-hidden="true">
      {doctor.name.trim().charAt(0).toLocaleUpperCase("ka-GE")}
    </span>
  );
}

export default async function MyAppointmentsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.user.accountType !== "PATIENT") {
    redirect("/dashboard");
  }

  const appointments = await prisma.appointment.findMany({
    where: { patientId: session.user.id },
    include: { doctor: { include: { clinic: true } } },
    orderBy: { startsAt: "desc" },
  });

  // მომავალი = აქტიური და ჯერ არ დამდგარი; უახლოესი პირველია (ამიტომ reverse).
  // დანარჩენი (დასრულებული, გაუქმებული, გასული) ისტორიაში მიდის
  const now = new Date();
  const upcoming = appointments
    .filter((appointment) => appointment.status === "BOOKED" && appointment.startsAt >= now)
    .reverse();
  const history = appointments.filter((appointment) => !upcoming.includes(appointment));

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>ჩემი ვიზიტები</h1>

        <h2>მომავალი ვიზიტები</h2>
        {upcoming.length === 0 ? (
          <p className={list.empty}>
            მომავალი ვიზიტი არ გაქვს. <Link href="/booking">დაჯავშნე ვიზიტი</Link>
          </p>
        ) : (
          <ul className={list.list}>
            {upcoming.map((appointment) => (
              <li key={appointment.id} className={list.item}>
                <div className={list.summary}>
                  <DoctorAvatar doctor={appointment.doctor} />
                  <div className={list.info}>
                    <h3>
                      {formatDateTime(appointment.startsAt)}
                      <span className={`${list.status} ${list[appointment.status]}`}>
                        {statusLabels[appointment.status]}
                      </span>
                    </h3>
                    <p>{appointment.doctor.name} · {appointment.doctor.specialty}</p>
                    <p>
                      {appointment.doctor.clinic.name}, {appointment.doctor.clinic.address}
                      {appointment.doctor.room && <> · კაბინეტი {appointment.doctor.room}</>}
                    </p>
                  </div>
                </div>
                <AppointmentActions appointmentId={appointment.id} canCancel />
              </li>
            ))}
          </ul>
        )}

        <h2>ისტორია და რეცეპტები</h2>
        {history.length === 0 ? (
          <p className={list.empty}>ისტორია ჯერ ცარიელია.</p>
        ) : (
          <ul className={list.list}>
            {history.map((appointment) => (
              <li key={appointment.id} className={list.item}>
                <div className={list.summary}>
                  <DoctorAvatar doctor={appointment.doctor} />
                  <div className={list.info}>
                    <h3>
                      {formatDateTime(appointment.startsAt)}
                      <span className={`${list.status} ${list[appointment.status]}`}>
                        {statusLabels[appointment.status]}
                      </span>
                    </h3>
                    <p>{appointment.doctor.name} · {appointment.doctor.specialty}</p>
                    <p>{appointment.doctor.clinic.name}</p>
                    {appointment.diagnosis && (
                      <p className={list.note}>
                        <strong>დიაგნოზი:</strong> {appointment.diagnosis}
                        {appointment.prescription && (
                          <>
                            <br />
                            <strong>დანიშნულება:</strong> {appointment.prescription}
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <AppointmentActions
                  appointmentId={appointment.id}
                  canCancel={appointment.status === "BOOKED"}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
