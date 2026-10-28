import { redirect } from "next/navigation";
import Sidebar from "@/components/navigation/Sidebar";
import { cancellationText, displayStatus } from "@/lib/appointment-status";
import { loginUrl } from "@/lib/next-url";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDateTime } from "@/lib/time";
import PatientCard, { type PatientCardData } from "./_components/PatientCard";
import styles from "./DoctorPatients.module.scss";

// ექიმის გვერდი „ჩემი პაციენტები“: ყველა პაციენტი, ვისაც ამ ექიმმა უმკურნალა.
// ბარათზე დაჭერით იხსნება ამ პაციენტის ყველა ვიზიტი ამ ექიმთან.
// ექიმი ხედავს მხოლოდ საკუთარ ვიზიტებს — სხვა ექიმების დიაგნოზებს არა
export default async function DoctorPatientsPage() {
  const session = await getSession();

  if (!session) {
    redirect(loginUrl("/doctor-patients"));
  }

  if (session.user.accountType !== "DOCTOR") {
    redirect("/dashboard");
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: session.user.id },
    include: {
      appointments: {
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
  // დალაგებული, ამიტომ პირველი ნაპოვნი დასრულებული ვიზიტი ბოლოა.
  // კლიენტის კომპონენტს Date კი არა, მზა ტექსტი გადაეცემა
  const now = new Date();
  const byPatient = new Map<string, PatientCardData>();

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
        visits: [],
      };
      byPatient.set(appointment.patientId, item);
    }

    // მოდალში ყველა ვიზიტი ჩანს, გაუქმებულიც
    item.visits.push({
      id: appointment.id,
      dateTime: formatDateTime(appointment.startsAt),
      status: displayStatus(appointment.status, appointment.startsAt, now),
      diagnosis: appointment.diagnosis,
      prescription: appointment.prescription,
      cancelText:
        appointment.status === "CANCELLED"
          ? cancellationText(appointment.cancelledBy, appointment.cancelReason)
          : null,
    });

    if (appointment.status === "COMPLETED") {
      item.completedVisits += 1;
      if (!item.lastVisit) {
        item.lastVisit = formatDateTime(appointment.startsAt);
        item.lastDiagnosis = appointment.diagnosis;
      }
    } else if (appointment.status === "BOOKED" && appointment.startsAt > now) {
      // სიაში ბოლოს ნაპოვნი მომავალი ვიზიტი ყველაზე ახლოა
      item.nextVisit = formatDateTime(appointment.startsAt);
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
              <PatientCard key={patient.id} patient={patient} />
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
