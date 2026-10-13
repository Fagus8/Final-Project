import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import styles from "./PatientProfiles.module.scss";

export default async function PatientProfilesPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    return (
      <div className={styles.page}>
        <Sidebar />
        <main className={styles.main}>
          <h1>პაციენტის პროფილი</h1>
          <section className={styles.profileCard}>
            <p>ამ გვერდის ნახვა მხოლოდ ადმინისტრატორს შეუძლია.</p>
          </section>
        </main>
      </div>
    );
  }

  const patients = await prisma.user.findMany({
  where: { accountType: "PATIENT" },
  select: {
    id: true,
    name: true,
    email: true,
  },
  orderBy: { name: "asc" },
});

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1>პაციენტის პროფილი</h1>
        <section className={styles.profileCard}>
          {patients.length === 0 ? (
            <p>პაციენტების ინფორმაცია ჯერ დამატებული არ არის.</p>
          ) : (
            patients.map((patient) => (
              <dl key={patient.id} className={styles.details}>
            <div>
              <dt>სახელი</dt>
                <dd>{patient.name}</dd>
               </div>
              <div>
                  <dt>ელფოსტა</dt>
               <          dd>{patient.email}</dd>
            </div>
                </dl>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
