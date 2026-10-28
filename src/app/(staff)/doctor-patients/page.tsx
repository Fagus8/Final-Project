import { redirect } from "next/navigation";
import Sidebar from "@/components/navigation/Sidebar";
import { loginUrl } from "@/lib/next-url";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDateTime } from "@/lib/time";
import styles from "./DoctorPatients.module.scss";

// ექიმის გვერდი „ჩემი პაციენტები“: ყველა პაციენტი, ვისაც ამ ექიმმა უმკურნალა.
// ექიმი ხედავს მხოლოდ საკუთარ ვიზიტებს — სხვა ექიმების დიაგნოზებს არა
export default async function DoctorPatientsPage() {
  const session = await getSession();

  if (!session) {
    redirect(loginUrl("/doctor-patients"));
  }

  if (session.user.accountType !== "DOCTOR") {
    redirect("/dashboard");
  }

  // გაუქმებული ვიზიტები არ ითვლება — ასეთი პაციენტი ექიმთან არ ყოფილა
  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    include: {
      appointments: {
        where: { status: { not: "CANCELLED" } },
        include: { patient: { include: { patient: { select: { phone: true, bloodType: true } } } } },
        orderBy: { startsAt: "desc" },
      },
    },
  });

  // კლინიკის დადასტურებამდე პაციენტები არ ეყოლება — სტატუსს „ჩემი განრიგი“ აჩვენებს
  if (!doctor || !doctor.isApproved || doctor.rejectedAt || doctor.removedAt) {
    redirect("/doctor-schedule");
  }

  // ვიზიტებს პაციენტების მიხედვით ვაჯგუფებთ. ვიზიტები ახლიდან ძველისკენაა
  // დალაგებული, ამიტომ პირველი ნაპოვნი დასრულებული ვიზიტი ბოლოა
  const now = new Date();
  const byPatient = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      phone: string | null;
      bloodType: string | null;
      completedVisits: number;
      lastVisit: Date | null;
      lastDiagnosis: string | null;
      nextVisit: Date | null;
    }
  >();

  for (const appointment of doctor.appointments) {
    let item = byPatient.get(appointment.patientId);
    if (!item) {
      item = {
        id: appointment.patientId,
        name: appointment.patient.name,
        email: appointment.patient.email,
        phone: appointment.patient.patient?.phone ?? null,
        bloodType: appointment.patient.patient?.bloodType ?? null,
        completedVisits: 0,
        lastVisit: null,
        lastDiagnosis: null,
        nextVisit: null,
      };
      byPatient.set(appointment.patientId, item);
    }

    if (appointment.status === "COMPLETED") {
      item.completedVisits += 1;
      if (!item.lastVisit) {
        item.lastVisit = appointment.startsAt;
        item.lastDiagnosis = appointment.diagnosis;
      }
    } else if (appointment.startsAt > now) {
      // სიაში ბოლოს ნაპოვნი მომავალი ვიზიტი ყველაზე ახლოა
      item.nextVisit = appointment.startsAt;
    }
  }

  // სიაში მხოლოდ ნამკურნალები პაციენტები — ვისაც ერთი დასრულებული ვიზიტი მაინც აქვს
  // (იგივე რიცხვი ჩანს პირად კაბინეტში „ნამკურნალები პაციენტების“ ბარათზე)
  const patients = [...byPatient.values()]
    .filter((patient) => patient.completedVisits > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "ka"));

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1>ჩემი პაციენტები ({patients.length})</h1>
        {patients.length === 0 ? (
          <p className={styles.empty}>ჯერ არცერთი ვიზიტი არ დაგისრულებია.</p>
        ) : (
          <section className={styles.grid}>
            {patients.map((patient) => (
              <article key={patient.id} className={styles.patient}>
                <header className={styles.header}>
                  <span className={styles.initial} aria-hidden="true">
                    {patient.name.charAt(0)}
                  </span>
                  <div>
                    <h2>{patient.name}</h2>
                    <p>{patient.email}</p>
                  </div>
                </header>

                <ul className={styles.tags}>
                  {patient.phone && <li>{patient.phone}</li>}
                  {patient.bloodType && <li>სისხლის ჯგუფი {patient.bloodType}</li>}
                  <li>ვიზიტები: {patient.completedVisits}</li>
                </ul>

                <dl className={styles.details}>
                  <div>
                    <dt>ბოლო ვიზიტი</dt>
                    <dd>{patient.lastVisit ? formatDateTime(patient.lastVisit) : "—"}</dd>
                  </div>
                  <div>
                    <dt>შემდეგი ვიზიტი</dt>
                    <dd>{patient.nextVisit ? formatDateTime(patient.nextVisit) : "—"}</dd>
                  </div>
                </dl>

                <div className={styles.diagnosis}>
                  <span>ბოლო დიაგნოზი</span>
                  <p>{patient.lastDiagnosis ?? "—"}</p>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
