import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AppointmentActions from "@/components/appointments/AppointmentActions";
import DoctorScheduleForm from "@/components/doctors/DoctorScheduleForm";
import list from "@/components/appointments/AppointmentList.module.scss";
import Sidebar from "@/components/layout/Sidebar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, statusLabels } from "@/lib/slots";
import styles from "../Staff.module.scss";
import ApproveDoctorButtons from "./_components/ApproveDoctorButtons";
import clinicStyles from "./MyClinic.module.scss";

export default async function MyClinicPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.user.accountType !== "CLINIC") {
    redirect("/dashboard");
  }

  const clinic = await prisma.clinic.findUnique({
    where: { id: session.user.id },
    include: {
      doctors: {
        include: { appointments: { include: { patient: true } } },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!clinic) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <main className={styles.main}>
          <h1 className={styles.title}>კლინიკის მართვა</h1>
          <p className={styles.card}>კლინიკის მონაცემები ვერ მოიძებნა. დაასრულე რეგისტრაცია.</p>
        </main>
      </div>
    );
  }

  // ექიმები, რომლებიც თვითონ დარეგისტრირდნენ და დადასტურებას ელოდებიან
  const pendingDoctors = clinic.doctors.filter((doctor) => !doctor.isApproved && doctor.email);
  // კლინიკის დადასტურებამდე მის ექიმებსაც isApproved=false აქვთ, ამიტომ მაშინ ყველას ვაჩვენებთ
  const doctors = clinic.isApproved
    ? clinic.doctors.filter((doctor) => doctor.isApproved)
    : clinic.doctors;

  // ყველა ვიზიტი ერთ სიაში, ექიმის სახელით
  const appointments = doctors
    .flatMap((doctor) => doctor.appointments.map((appointment) => ({ ...appointment, doctor })))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const now = new Date();
  const upcoming = appointments.filter((a) => a.status === "BOOKED" && a.startsAt >= now);
  const cancelled = appointments.filter((a) => a.status === "CANCELLED").reverse();

  const countByStatus = (status: string) => appointments.filter((a) => a.status === status).length;

  // კაბინეტის კონფლიქტი: ორ ექიმს ერთი კაბინეტი აქვს და საათები ემთხვევა
  const roomWarnings: string[] = [];
  doctors.forEach((first, index) => {
    doctors.slice(index + 1).forEach((second) => {
      if (
        first.room &&
        first.room === second.room &&
        first.workStart < second.workEnd &&
        second.workStart < first.workEnd
      ) {
        roomWarnings.push(`კაბინეტი ${first.room}: ${first.name} და ${second.name} ერთსა და იმავე დროს მუშაობენ`);
      }
    });
  });

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>კლინიკის მართვა — {clinic.name}</h1>

        {!clinic.isApproved && (
          <p className={styles.card}>კლინიკა ჯერ არ არის დამტკიცებული ადმინისტრატორის მიერ.</p>
        )}

        {pendingDoctors.length > 0 && (
          <>
            <h2>ახალი ექიმები ({pendingDoctors.length})</h2>
            <ul className={list.list}>
              {pendingDoctors.map((doctor) => (
                <li key={doctor.id} className={list.item}>
                  <div className={list.info}>
                    <h3>{doctor.name}</h3>
                    <p>{doctor.specialty} · გამოცდილება: {doctor.experienceYears} წელი</p>
                    <p>{doctor.email}</p>
                  </div>
                  <ApproveDoctorButtons doctorId={doctor.id} />
                </li>
              ))}
            </ul>
          </>
        )}

        {/* სტატისტიკა */}
        <section className={clinicStyles.stats}>
          <div><span>სულ ვიზიტები</span><strong>{appointments.length}</strong></div>
          <div><span>დაჯავშნილი</span><strong>{countByStatus("BOOKED")}</strong></div>
          <div><span>დასრულებული</span><strong>{countByStatus("COMPLETED")}</strong></div>
          <div><span>გაუქმებული</span><strong>{countByStatus("CANCELLED")}</strong></div>
        </section>

        <section className={styles.card}>
          <div className={clinicStyles.reportHeader}>
            <h2>ანგარიში ექიმების მიხედვით</h2>
            <a href="/api/clinic/report" className={clinicStyles.download}>CSV ჩამოტვირთვა</a>
          </div>
          <table className={clinicStyles.table}>
            <thead>
              <tr>
                <th>ექიმი</th>
                <th>სულ</th>
                <th>დასრულებული</th>
                <th>გაუქმებული</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td>{doctor.name}</td>
                  <td>{doctor.appointments.length}</td>
                  <td>{doctor.appointments.filter((a) => a.status === "COMPLETED").length}</td>
                  <td>{doctor.appointments.filter((a) => a.status === "CANCELLED").length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* გრაფიკები და კაბინეტები */}
        <section className={styles.card}>
          <h2>ექიმების გრაფიკი და კაბინეტები</h2>
          {roomWarnings.map((warning) => (
            <p key={warning} className={clinicStyles.warning}>⚠ {warning}</p>
          ))}
          {doctors.map((doctor) => (
            <div key={doctor.id} className={clinicStyles.doctorRow}>
              <h3>{doctor.name} · {doctor.specialty}</h3>
              <DoctorScheduleForm
                isClinic
                doctor={{
                  id: doctor.id,
                  workStart: doctor.workStart,
                  workEnd: doctor.workEnd,
                  email: doctor.email,
                  room: doctor.room,
                }}
              />
            </div>
          ))}
        </section>

        <h2>მომავალი ვიზიტები</h2>
        {upcoming.length === 0 ? (
          <p className={list.empty}>მომავალი ვიზიტები არ არის.</p>
        ) : (
          <ul className={list.list}>
            {upcoming.map((appointment) => (
              <li key={appointment.id} className={list.item}>
                <div className={list.info}>
                  <h3>{formatDateTime(appointment.startsAt)}</h3>
                  <p>{appointment.doctor.name} → {appointment.patient.name}</p>
                </div>
                <AppointmentActions appointmentId={appointment.id} canCancel />
              </li>
            ))}
          </ul>
        )}

        <h2>გაუქმებული ვიზიტები</h2>
        {cancelled.length === 0 ? (
          <p className={list.empty}>გაუქმებული ვიზიტები არ არის.</p>
        ) : (
          <ul className={list.list}>
            {cancelled.map((appointment) => (
              <li key={appointment.id} className={list.item}>
                <div className={list.info}>
                  <h3>
                    {formatDateTime(appointment.startsAt)}
                    <span className={`${list.status} ${list.CANCELLED}`}>
                      {statusLabels.CANCELLED}
                    </span>
                  </h3>
                  <p>{appointment.doctor.name} → {appointment.patient.name} ({appointment.patient.email})</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
