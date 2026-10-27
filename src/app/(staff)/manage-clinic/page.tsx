import { redirect } from "next/navigation";
import AppointmentActions from "@/components/appointments/AppointmentActions";
import list from "@/components/ui/List.module.scss";
import DeleteClinicButton from "@/components/clinics/DeleteClinicButton";
import DoctorProfileForm from "@/components/doctors/DoctorProfileForm";
import DoctorSettingsForm from "@/components/doctors/DoctorSettingsForm";
import Sidebar from "@/components/navigation/Sidebar";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { statusLabels } from "@/lib/appointment-status";
import { formatDateTime } from "@/lib/time";
import styles from "../Staff.module.scss";
import ApproveDoctorButtons from "./_components/ApproveDoctorButtons";
import clinicStyles from "./ManageClinic.module.scss";

// რამდენი ვიზიტია მოცემული სტატუსით
function countByStatus(appointments: { status: string }[], status: string) {
  return appointments.filter((appointment) => appointment.status === status).length;
}

// კლინიკის გვერდი „კლინიკის მართვა“: ახალი ექიმების მოთხოვნები, სტატისტიკა,
// ანგარიში ექიმების მიხედვით, ექიმების საათები და კაბინეტები,
// მომავალი და გაუქმებული ვიზიტები, კლინიკის წაშლა
export default async function ManageClinicPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.accountType !== "CLINIC") {
    redirect("/dashboard");
  }

  // კლინიკის id = ანგარიშის id; ექიმებთან, მათ ვიზიტებთან და ანგარიშის ელფოსტასთან ერთად
  const clinic = await prisma.clinic.findUnique({
    where: { id: session.user.id },
    include: {
      doctors: {
        include: {
          appointments: { include: { patient: true } },
          user: { select: { email: true } },
        },
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

  // ექიმები, რომლებმაც ეს კლინიკა აირჩიეს და დადასტურებას ელოდებიან
  const pendingDoctors = clinic.doctors.filter((doctor) => !doctor.isApproved);
  const doctors = clinic.doctors.filter((doctor) => doctor.isApproved);

  // ყველა ვიზიტი ერთ სიაში, ექიმის სახელით
  const appointments = doctors
    .flatMap((doctor) => doctor.appointments.map((appointment) => ({ ...appointment, doctor })))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const now = new Date();
  const upcoming = appointments.filter((a) => a.status === "BOOKED" && a.startsAt >= now);
  // გაუქმებული ვიზიტები — ბოლოს გაუქმებული ზემოთ
  const cancelled = appointments.filter((a) => a.status === "CANCELLED").reverse();

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
                    <p>
                      {doctor.specialty} · გამოცდილება: {doctor.experienceYears} წელი
                    </p>
                    <p>{doctor.user.email}</p>
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
          <div><span>დაჯავშნილი</span><strong>{countByStatus(appointments, "BOOKED")}</strong></div>
          <div><span>დასრულებული</span><strong>{countByStatus(appointments, "COMPLETED")}</strong></div>
          <div><span>გაუქმებული</span><strong>{countByStatus(appointments, "CANCELLED")}</strong></div>
        </section>

        <section className={styles.card}>
          <h2>ანგარიში ექიმების მიხედვით</h2>
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
                  <td>{countByStatus(doctor.appointments, "COMPLETED")}</td>
                  <td>{countByStatus(doctor.appointments, "CANCELLED")}</td>
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
              <DoctorSettingsForm
                isClinic
                doctor={{
                  id: doctor.id,
                  workStart: doctor.workStart,
                  workEnd: doctor.workEnd,
                  room: doctor.room,
                }}
              />
              <details className={clinicStyles.profileDetails}>
                <summary>პროფილის რედაქტირება (სპეციალობა, გამოცდილება, ფოტო, ფასი...)</summary>
                <DoctorProfileForm
                  isClinic
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
              </details>
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

        <section className={`${styles.card} ${clinicStyles.dangerZone}`}>
          <h2>კლინიკის წაშლა</h2>
          <p>კლინიკა სისტემიდან სამუდამოდ წაიშლება ექიმებთან და ვიზიტებთან ერთად.</p>
          <DeleteClinicButton clinicId={clinic.id} clinicName={clinic.name} isOwnClinic />
        </section>
      </main>
    </div>
  );
}
