import Link from "next/link";
import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";
import DoctorProfileForm from "@/components/doctors/DoctorProfileForm";
import DoctorSettingsForm from "@/components/doctors/DoctorSettingsForm";
import DoctorStatusNotice from "@/components/doctors/DoctorStatusNotice";
import JoinClinicForm from "@/components/doctors/JoinClinicForm";
import Sidebar from "@/components/navigation/Sidebar";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { loginUrl } from "@/lib/next-url";
import { formatDateTime, formatDay, formatTime } from "@/lib/time";
import account from "@/app/(account)/Account.module.scss";
import styles from "../Staff.module.scss";

// ექიმის გვერდი „ჩემი პროფილი“ — ექიმის პირადი კაბინეტიც ესაა:
// კლინიკები და შემდეგი პაციენტი, ანგარიში, საჯარო პროფილის რედაქტირება,
// თითო კლინიკის სამუშაო გრაფიკი, სხვა კლინიკასთან მოთხოვნა და პაროლის შეცვლა.
// სანამ არცერთი კლინიკა არ დაადასტურებს — მდგომარეობა და კლინიკების არჩევის ფორმა
export default async function DoctorProfileEditPage({ searchParams }: PageProps<"/doctor-profile">) {
  const session = await getSession();

  if (!session) {
    redirect(loginUrl("/doctor-profile"));
  }

  if (session.user.accountType !== "DOCTOR") {
    redirect("/dashboard");
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    include: { clinics: { include: { clinic: true }, orderBy: { createdAt: "asc" } } },
  });
  const memberships = doctor?.clinics ?? [];
  const approved = memberships.filter((item) => item.isApproved);
  const pending = memberships.filter((item) => !item.isApproved && !item.rejectedAt && !item.removedAt);

  // მოთხოვნის ფორმაში ის დამტკიცებული კლინიკებია, რომლებთანაც აქტიური კავშირი ჯერ არ აქვს
  const clinicsToJoin = await prisma.clinic.findMany({
    where: {
      isApproved: true,
      id: { notIn: [...approved, ...pending].map((item) => item.clinicId) },
    },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  const passwordCard = (
    <section className={styles.card}>
      <h2>პაროლის შეცვლა</h2>
      <ChangePasswordForm />
    </section>
  );

  // არცერთ კლინიკას ჯერ არ დაუდასტურებია: არ აურჩევია, ელოდება, უარყვეს ან მოხსნეს
  if (!doctor || approved.length === 0) {
    // რეგისტრაციისას შეყვანილი სპეციალობა და გამოცდილება URL-ით მოდის,
    // ან წინა მოთხოვნიდან აიღება
    const { specialty, experience } = await searchParams;
    const defaults = {
      specialty: typeof specialty === "string" ? specialty : (doctor?.specialty ?? ""),
      experienceYears: Math.max(0, Math.trunc(Number(experience ?? doctor?.experienceYears)) || 0),
    };

    return (
      <div className={styles.page}>
        <Sidebar />
        <main className={styles.main}>
          <h1 className={styles.title}>ჩემი პროფილი</h1>
          <p className={styles.card}>
            <DoctorStatusNotice clinics={memberships} showLink={false} />
          </p>
          {clinicsToJoin.length > 0 && (
            <section className={styles.card}>
              <h2>{pending.length > 0 ? "სხვა კლინიკის დამატება" : "აირჩიე კლინიკა"}</h2>
              <p>აირჩიე ერთი ან რამდენიმე კლინიკა — თითოეული ცალკე დაადასტურებს მოთხოვნას.</p>
              <JoinClinicForm clinics={clinicsToJoin} defaults={defaults} />
            </section>
          )}
          {passwordCard}
        </main>
      </div>
    );
  }

  const now = new Date();
  const nextAppointment = await prisma.appointment.findFirst({
    where: { doctorId: doctor.id, status: "BOOKED", startsAt: { gte: now } },
    include: { patient: true },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>ჩემი პროფილი</h1>

        <section className={account.details} aria-label="სამუშაო ინფორმაცია">
          <article className={account.detailCard}>
            <span className={account.detailLabel}>{approved.length > 1 ? "კლინიკები" : "კლინიკა"}</span>
            <span className={account.detailValue}>{approved.map((item) => item.clinic.name).join(", ")}</span>
            <span className={account.detailLabel}>{doctor.specialty}</span>
            {/* თითო კლინიკის კაბინეტი და საათები */}
            {approved.map((item) => (
              <span key={item.id} className={account.detailLabel}>
                {approved.length > 1 && <>{item.clinic.name}: </>}
                {item.room && <>კაბინეტი {item.room} · </>}
                {item.workStart}–{item.workEnd}
              </span>
            ))}
          </article>

          <article className={account.detailCard}>
            <span className={account.detailLabel}>შემდეგი პაციენტი</span>
            {nextAppointment ? (
              <>
                <span className={account.detailValue}>{nextAppointment.patient.name}</span>
                <span className={account.detailLabel}>
                  {formatDay(nextAppointment.startsAt) === formatDay(now)
                    ? `დღეს, ${formatTime(nextAppointment.startsAt)}`
                    : formatDateTime(nextAppointment.startsAt)}
                </span>
              </>
            ) : (
              <span className={account.detailValue}>ჩაწერილი პაციენტი არ არის</span>
            )}
          </article>
        </section>

        <section className={styles.card}>
          <h2>{doctor.name}</h2>
          <h3>ანგარიში</h3>
          <p>ელფოსტა: {session.user.email}</p>
          <p>რეგისტრაციის თარიღი: {new Date(session.user.createdAt).toLocaleDateString("ka-GE")}</p>
        </section>

        <section className={styles.card}>
          <h2>პროფილის ინფორმაცია</h2>
          <p>
            ეს ინფორმაცია ჩანს შენს{" "}
            <Link href={`/doctors/${doctor.id}`}>საჯარო პროფილზე</Link>.
          </p>
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

        {/* თითო კლინიკას თავისი გრაფიკი აქვს */}
        {approved.map((membership) => (
          <section key={membership.id} className={styles.card}>
            <h2>სამუშაო გრაფიკი — {membership.clinic.name}</h2>
            {membership.room && <p>კაბინეტი {membership.room}</p>}
            <DoctorSettingsForm
              doctor={{
                id: doctor.id,
                clinicId: membership.clinicId,
                workStart: membership.workStart,
                workEnd: membership.workEnd,
                workDays: membership.workDays,
                daysOff: membership.daysOff,
                room: membership.room,
              }}
            />
          </section>
        ))}

        <section className={styles.card}>
          <h2>სხვა კლინიკაში მუშაობა</h2>
          {pending.length > 0 && (
            <p>დადასტურებას ელოდება: {pending.map((item) => item.clinic.name).join(", ")}.</p>
          )}
          {clinicsToJoin.length > 0 ? (
            <JoinClinicForm clinics={clinicsToJoin} />
          ) : (
            <p>ყველა დამტკიცებულ კლინიკასთან უკვე დაკავშირებული ხარ.</p>
          )}
        </section>

        {passwordCard}
      </main>
    </div>
  );
}
