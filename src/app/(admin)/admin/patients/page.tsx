import { redirect } from "next/navigation";
import Sidebar from "@/components/navigation/Sidebar";
import { loginUrl } from "@/lib/next-url";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import styles from "./Patients.module.scss";

// ადმინის გვერდი: რეგისტრირებული პაციენტების სია
export default async function PatientsPage() {
  const session = await getSession();

  if (!session) {
    redirect(loginUrl("/admin/patients"));
  }

  // გვერდი მხოლოდ ადმინისთვისაა — დანარჩენ გვერდებზეც ასე ვიქცევით
  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  // მხოლოდ საჭირო ველები — პაროლის ჰეში და სხვა მონაცემები გვერდზე არ მოდის
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
        <h1>პაციენტები ({patients.length})</h1>
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
                  <dd>{patient.email}</dd>
                </div>
              </dl>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
