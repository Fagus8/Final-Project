import Link from "next/link";
import { redirect } from "next/navigation";
import AppointmentActions from "@/components/appointments/AppointmentActions";
import list from "@/components/ui/List.module.scss";
import DeleteClinicButton from "@/components/clinics/DeleteClinicButton";
import DoctorProfileForm from "@/components/doctors/DoctorProfileForm";
import DoctorSettingsForm from "@/components/doctors/DoctorSettingsForm";
import Sidebar from "@/components/navigation/Sidebar";
import type { Prisma } from "@/generated/prisma/client";
import { cancellationText, displayStatus, statusLabels } from "@/lib/appointment-status";
import { activeClinicWhere } from "@/lib/doctors";
import { loginUrl } from "@/lib/next-url";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDateTime } from "@/lib/time";
import styles from "../Staff.module.scss";
import ApproveDoctorButtons from "./_components/ApproveDoctorButtons";
import RemoveDoctorButton from "./_components/RemoveDoctorButton";
import clinicStyles from "./ManageClinic.module.scss";

// ტაბები URL-ში ინახება (?tab=visits), რომ გვერდის განახლებისას იგივე ტაბი დარჩეს
const tabs = [
  { key: "doctors", label: "ექიმები" },
  { key: "visits", label: "ვიზიტები" },
  { key: "settings", label: "პარამეტრები" },
] as const;

type Tab = (typeof tabs)[number]["key"];

// ვიზიტების ფილტრის პერიოდები
const periods = [
  { key: "upcoming", label: "მომავალი" },
  { key: "past", label: "წარსული" },
  { key: "all", label: "ყველა" },
] as const;

// რამდენი ვიზიტია მოცემული სტატუსით
function countByStatus(appointments: { status: string }[], status: string) {
  return appointments.filter((appointment) => appointment.status === status).length;
}

// URL-ის პარამეტრი ტექსტად (მასივი ან undefined → "")
function param(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

// კლინიკის გვერდი „კლინიკის მართვა“, სამ ტაბად:
// ექიმები — ახალი მოთხოვნები, გრაფიკები, კაბინეტები, პროფილები, მოხსნა;
// ვიზიტები — სტატისტიკა და ვიზიტების სია ფილტრით;
// პარამეტრები — კლინიკის მონაცემები და წაშლა
export default async function ManageClinicPage({ searchParams }: PageProps<"/manage-clinic">) {
  const session = await getSession();
  const query = await searchParams;

  if (!session) {
    redirect(loginUrl("/manage-clinic"));
  }

  if (session.user.accountType !== "CLINIC") {
    redirect("/dashboard");
  }

  // კლინიკის id = ანგარიშის id; აქტიური ექიმები (კავშირები), მათი ამ კლინიკის ვიზიტები
  // და ანგარიშის ელფოსტა
  const clinic = await prisma.clinic.findUnique({
    where: { id: session.user.id },
    include: {
      doctors: {
        where: activeClinicWhere,
        include: {
          doctor: {
            include: {
              appointments: { where: { clinicId: session.user.id }, include: { patient: true } },
              user: { select: { email: true } },
            },
          },
        },
        orderBy: { doctor: { name: "asc" } },
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

  const tab: Tab = tabs.some((item) => item.key === query.tab) ? (query.tab as Tab) : "doctors";

  // ექიმი და მისი კავშირი ამ კლინიკასთან (გრაფიკი, კაბინეტი) ერთ ობიექტად; id — ექიმის id
  const clinicDoctors: ClinicDoctor[] = clinic.doctors.map(({ doctor, ...membership }) => ({
    ...membership,
    ...doctor,
  }));

  // ექიმები, რომლებმაც ეს კლინიკა აირჩიეს და დადასტურებას ელოდებიან
  const pendingDoctors = clinicDoctors.filter((doctor) => !doctor.isApproved);
  const doctors = clinicDoctors.filter((doctor) => doctor.isApproved);
  const now = new Date();

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>კლინიკის მართვა — {clinic.name}</h1>

        {!clinic.isApproved && (
          <p className={clinicStyles.warning}>
            კლინიკა ჯერ არ არის დამტკიცებული ადმინისტრატორის მიერ — მანამდე ის საიტზე არ ჩანს
            და ექიმები მას ვერ აირჩევენ.
          </p>
        )}

        <nav className={clinicStyles.tabs} aria-label="კლინიკის მართვის განყოფილებები">
          {tabs.map((item) => (
            <Link
              key={item.key}
              href={`/manage-clinic?tab=${item.key}`}
              className={tab === item.key ? clinicStyles.activeTab : ""}
              aria-current={tab === item.key ? "page" : undefined}
            >
              {item.label}
              {item.key === "doctors" && pendingDoctors.length > 0 && (
                <span className={clinicStyles.badge} aria-label={`${pendingDoctors.length} ახალი მოთხოვნა`}>
                  {pendingDoctors.length}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {tab === "doctors" && <DoctorsTab pendingDoctors={pendingDoctors} doctors={doctors} now={now} />}
        {tab === "visits" && <VisitsTab doctors={doctors} query={query} now={now} />}
        {tab === "settings" && (
          <>
            <section className={styles.card}>
              <h2>კლინიკის მონაცემები</h2>
              <p>{clinic.city}, {clinic.address}</p>
              <p>{clinic.phone} · {clinic.specialty}</p>
              <p>სტატუსი: {clinic.isApproved ? "დამტკიცებული" : "ელოდება დამტკიცებას"}</p>
              <p>მონაცემების შესაცვლელად დაუკავშირდი ადმინისტრატორს.</p>
            </section>

            <section className={`${styles.card} ${clinicStyles.dangerZone}`}>
              <h2>კლინიკის წაშლა</h2>
              <p>
                კლინიკის ანგარიში სამუდამოდ წაიშლება. ექიმები კლინიკას მოშორდებიან, აქ მომავალი
                ვიზიტები გაუქმდება, პაციენტების ისტორია (დიაგნოზები) კი შენარჩუნდება.
              </p>
              <DeleteClinicButton clinicId={clinic.id} clinicName={clinic.name} isOwnClinic />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

// კლინიკის ექიმი ამ კლინიკის გრაფიკით, ვიზიტებით და ელფოსტით (როგორც ზემოთ ვაწყობთ)
type ClinicDoctor = Omit<Prisma.DoctorClinicGetPayload<object>, "id"> &
  Prisma.DoctorGetPayload<{
    include: { appointments: { include: { patient: true } }; user: { select: { email: true } } };
  }>;

// ტაბი „ექიმები“
function DoctorsTab({
  pendingDoctors,
  doctors,
  now,
}: {
  pendingDoctors: ClinicDoctor[];
  doctors: ClinicDoctor[];
  now: Date;
}) {
  // კაბინეტის კონფლიქტი: ორ ექიმს ერთი კაბინეტი აქვს, საერთო სამუშაო დღე და საათები ემთხვევა
  const roomWarnings: string[] = [];
  doctors.forEach((first, index) => {
    doctors.slice(index + 1).forEach((second) => {
      if (
        first.room &&
        first.room === second.room &&
        first.workDays.some((day) => second.workDays.includes(day)) &&
        first.workStart < second.workEnd &&
        second.workStart < first.workEnd
      ) {
        roomWarnings.push(`კაბინეტი ${first.room}: ${first.name} და ${second.name} ერთსა და იმავე დროს მუშაობენ`);
      }
    });
  });

  return (
    <>
      {pendingDoctors.length > 0 && (
        <>
          <h2>ახალი ექიმების მოთხოვნები ({pendingDoctors.length})</h2>
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
                <ApproveDoctorButtons doctorId={doctor.id} doctorName={doctor.name} />
              </li>
            ))}
          </ul>
        </>
      )}

      <section className={styles.card}>
        <h2>ექიმების გრაფიკი და კაბინეტები</h2>
        {doctors.length === 0 && (
          <p className={list.empty}>
            კლინიკას ჯერ ექიმები არ ჰყავს. ექიმები თვითონ რეგისტრირდებიან და ირჩევენ კლინიკას —
            მათი მოთხოვნები აქ გამოჩნდება.
          </p>
        )}
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
                clinicId: doctor.clinicId,
                workStart: doctor.workStart,
                workEnd: doctor.workEnd,
                workDays: doctor.workDays,
                daysOff: doctor.daysOff,
                room: doctor.room,
              }}
            />
            <div className={clinicStyles.rowActions}>
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
              <RemoveDoctorButton
                doctorId={doctor.id}
                clinicId={doctor.clinicId}
                doctorName={doctor.name}
                upcomingCount={
                  doctor.appointments.filter((a) => a.status === "BOOKED" && a.startsAt > now).length
                }
              />
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

// ტაბი „ვიზიტები“: სტატისტიკა, ანგარიში ექიმების მიხედვით და ვიზიტების სია ფილტრით
function VisitsTab({
  doctors,
  query,
  now,
}: {
  doctors: ClinicDoctor[];
  query: Record<string, string | string[] | undefined>;
  now: Date;
}) {
  const doctorId = param(query.doctorId);
  const status = param(query.status);
  const period = periods.some((item) => item.key === query.period) ? param(query.period) : "upcoming";

  // ყველა ვიზიტი ერთ სიაში, ექიმის სახელით
  const appointments = doctors
    .flatMap((doctor) => doctor.appointments.map((appointment) => ({ ...appointment, doctor })))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  // ფილტრი: ექიმი, სტატუსი, პერიოდი. წარსული — ბოლო პირველი
  let filtered = appointments.filter(
    (a) =>
      (!doctorId || a.doctorId === doctorId) &&
      (!status || a.status === status) &&
      (period === "all" || (period === "upcoming" ? a.startsAt >= now : a.startsAt < now)),
  );
  if (period === "past") {
    filtered = filtered.reverse();
  }

  return (
    <>
      <section className={clinicStyles.stats}>
        <div><span>სულ ვიზიტები</span><strong>{appointments.length}</strong></div>
        <div><span>დაჯავშნილი</span><strong>{countByStatus(appointments, "BOOKED")}</strong></div>
        <div><span>დასრულებული</span><strong>{countByStatus(appointments, "COMPLETED")}</strong></div>
        <div><span>გაუქმებული</span><strong>{countByStatus(appointments, "CANCELLED")}</strong></div>
      </section>

      {doctors.length > 0 && (
        <section className={styles.card}>
          <h2>ანგარიში ექიმების მიხედვით</h2>
          <div className={clinicStyles.tableWrap}>
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
          </div>
        </section>
      )}

      {/* ჩვეულებრივი GET ფორმა: ფილტრები URL-ში ჩაიწერება */}
      <form className={clinicStyles.filters} action="/manage-clinic">
        <input type="hidden" name="tab" value="visits" />
        <select name="period" defaultValue={period} aria-label="პერიოდი">
          {periods.map((item) => (
            <option key={item.key} value={item.key}>{item.label}</option>
          ))}
        </select>
        <select name="doctorId" defaultValue={doctorId} aria-label="ექიმი">
          <option value="">ყველა ექიმი</option>
          {doctors.map((doctor) => (
            <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={status} aria-label="სტატუსი">
          <option value="">ყველა სტატუსი</option>
          <option value="BOOKED">{statusLabels.BOOKED}</option>
          <option value="COMPLETED">{statusLabels.COMPLETED}</option>
          <option value="CANCELLED">{statusLabels.CANCELLED}</option>
        </select>
        <button type="submit">ჩვენება</button>
        <Link href="/manage-clinic?tab=visits">გასუფთავება</Link>
      </form>

      {filtered.length === 0 ? (
        <p className={list.empty}>ამ ფილტრით ვიზიტები არ არის.</p>
      ) : (
        <ul className={list.list}>
          {filtered.map((appointment) => {
            const shown = displayStatus(appointment.status, appointment.startsAt, now);

            return (
              <li key={appointment.id} className={list.item}>
                <div className={list.info}>
                  <h3>
                    {formatDateTime(appointment.startsAt)}
                    <span className={`${list.status} ${list[shown]}`}>{statusLabels[shown]}</span>
                  </h3>
                  <p>
                    {appointment.doctor.name} → {appointment.patient.name} ({appointment.patient.email})
                  </p>
                  {appointment.status === "CANCELLED" && (
                    <p className={list.cancelInfo}>
                      {cancellationText(appointment.cancelledBy, appointment.cancelReason)}
                    </p>
                  )}
                </div>
                {/* კლინიკას შეუძლია გააუქმოს დაჯავშნილი (მათ შორის გასული — პაციენტი არ გამოცხადდა) */}
                {appointment.status === "BOOKED" && (
                  <AppointmentActions appointmentId={appointment.id} canCancel />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
