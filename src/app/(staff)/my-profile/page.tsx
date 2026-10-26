import Link from "next/link";
import { redirect } from "next/navigation";
import DoctorProfileForm from "@/components/doctors/DoctorProfileForm";
import Sidebar from "@/components/layout/Sidebar";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import styles from "../Staff.module.scss";

// ექიმის გვერდი „ჩემი პროფილი“: ანგარიშის მონაცემები და საჯარო პროფილის რედაქტირება
export default async function MyProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.user.accountType !== "DOCTOR") {
    redirect("/dashboard");
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    include: { clinic: true },
  });

  // პროფილი კლინიკის დადასტურების შემდეგ ივსება — მანამდე „ჩემ განრიგზე“ ვაგზავნით
  if (!doctor || !doctor.isApproved) {
    return (
      <div className={styles.page}>
        <Sidebar />
        <main className={styles.main}>
          <h1 className={styles.title}>ჩემი პროფილი</h1>
          <p className={styles.card}>
            {doctor ? (
              <>
                შენი მოთხოვნა გაგზავნილია კლინიკაში <strong>{doctor.clinic.name}</strong>.
                დადასტურების შემდეგ აქ შეძლებ პროფილის შევსებას.
              </>
            ) : (
              <>
                შენი ანგარიში ჯერ არცერთ კლინიკას არ უკავშირდება.{" "}
                <Link href="/my-schedule">აირჩიე კლინიკა →</Link>
              </>
            )}
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>ჩემი პროფილი</h1>

        <section className={styles.card}>
          <h2>{doctor.name}</h2>
          <p>
            {doctor.specialty} · {doctor.clinic.name}
            {doctor.room && <> · კაბინეტი {doctor.room}</>}
          </p>
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
      </main>
    </div>
  );
}
