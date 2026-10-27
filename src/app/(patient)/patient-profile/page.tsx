import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";
import Sidebar from "@/components/navigation/Sidebar";
import { loginUrl } from "@/lib/next-url";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import PatientProfileForm from "./_components/PatientProfileForm";
// ბარათების სტილი პირად კაბინეტთან საერთოა
import styles from "../../(account)/Account.module.scss";

// პაციენტის პროფილი: ანგარიშის მონაცემები, მათი რედაქტირება და პაროლის შეცვლა
export default async function PatientProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect(loginUrl("/patient-profile"));
  }

  // გვერდი მხოლოდ პაციენტისთვისაა
  if (session.user.accountType !== "PATIENT" || session.user.role === "admin") {
    redirect("/dashboard");
  }

  // ტელეფონი და სისხლის ჯგუფი; რეგისტრაციამდე შექმნილ ანგარიშს შეიძლება არ ჰქონდეს
  const patient = await prisma.patient.findUnique({
    where: { id: session.user.id },
    select: { phone: true, bloodType: true },
  });

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>ჩემი პროფილი</h1>

        <section className={styles.details} aria-label="პროფილის ინფორმაცია">
          <article className={styles.detailCard}>
            <span className={styles.detailLabel}>ელფოსტა</span>
            <span className={styles.detailValue}>{session.user.email}</span>
          </article>
          <article className={styles.detailCard}>
            <span className={styles.detailLabel}>სისხლის ჯგუფი</span>
            <span className={styles.detailValue}>{patient?.bloodType ?? "უცნობია"}</span>
          </article>
          <article className={styles.detailCard}>
            <span className={styles.detailLabel}>ანგარიშის ტიპი</span>
            <span className={styles.accountType}>პაციენტი</span>
          </article>
          <article className={styles.detailCard}>
            <span className={styles.detailLabel}>რეგისტრაციის თარიღი</span>
            <span className={styles.detailValue}>
              {new Date(session.user.createdAt).toLocaleDateString("ka-GE")}
            </span>
          </article>
        </section>

        <section className={styles.formCard}>
          <h2>პირადი მონაცემები</h2>
          <PatientProfileForm
            name={session.user.name}
            phone={patient?.phone ?? ""}
            bloodType={patient?.bloodType ?? ""}
          />
        </section>

        <section className={styles.formCard}>
          <h2>პაროლის შეცვლა</h2>
          <ChangePasswordForm />
        </section>
      </main>
    </div>
  );
}
