import Link from "next/link";
import { redirect } from "next/navigation";
import AppointmentActions from "@/components/appointments/AppointmentActions";
import list from "@/components/ui/List.module.scss";
import Sidebar from "@/components/navigation/Sidebar";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { cancellationText, displayStatus, statusLabels } from "@/lib/appointment-status";
import { loginUrl } from "@/lib/next-url";
import { formatDateTime } from "@/lib/time";
import styles from "../Patient.module.scss";

// პაციენტის გვერდი „ჩემი ვიზიტები“: მომავალი ვიზიტები და ისტორია დიაგნოზებით
export default async function PatientVisitsPage() {
  const session = await getSession();

  if (!session) {
    redirect(loginUrl("/patient-visits"));
  }

  if (session.user.accountType !== "PATIENT") {
    redirect("/dashboard");
  }

  // ექიმის ჩანაწერი შეიძლება აღარ არსებობდეს (კლინიკა წაიშალა) —
  // მაშინ ვიზიტში შენახულ სახელებს ვაჩვენებთ
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
                  <DoctorAvatar
                    name={appointment.doctorName}
                    avatarUrl={appointment.doctor?.avatarUrl ?? null}
                    className={list.avatar}
                  />
                  <div className={list.info}>
                    <h3>
                      {formatDateTime(appointment.startsAt)}
                      <span className={`${list.status} ${list.BOOKED}`}>{statusLabels.BOOKED}</span>
                    </h3>
                    <p>{appointment.doctorName} · {appointment.doctorSpecialty}</p>
                    <p>
                      {appointment.clinicName}
                      {appointment.doctor && <>, {appointment.doctor.clinic.address}</>}
                      {appointment.doctor?.room && <> · კაბინეტი {appointment.doctor.room}</>}
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
            {history.map((appointment) => {
              // გასული დაჯავშნილი ვიზიტი „დიაგნოზის მოლოდინშია“ — მისი გაუქმება აღარ შეიძლება
              const status = displayStatus(appointment.status, appointment.startsAt, now);

              return (
                <li key={appointment.id} className={list.item}>
                  <div className={list.summary}>
                    <DoctorAvatar
                      name={appointment.doctorName}
                      avatarUrl={appointment.doctor?.avatarUrl ?? null}
                      className={list.avatar}
                    />
                    <div className={list.info}>
                      <h3>
                        {formatDateTime(appointment.startsAt)}
                        <span className={`${list.status} ${list[status]}`}>{statusLabels[status]}</span>
                      </h3>
                      <p>{appointment.doctorName} · {appointment.doctorSpecialty}</p>
                      <p>{appointment.clinicName}</p>
                      {appointment.status === "CANCELLED" && (
                        <p className={list.cancelInfo}>
                          {cancellationText(appointment.cancelledBy, appointment.cancelReason)}
                        </p>
                      )}
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
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
