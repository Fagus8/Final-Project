import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import Card from "@/components/ui/Card";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import styles from "./Doctors.module.scss";

// ექიმების სია, ყველასთვის ღია
export default async function DoctorsPage() {
  const session = await getSession();
  // „დაჯავშნა“ ღილაკი ჩანს სტუმრისთვის და პაციენტისთვის, კლინიკისა და ექიმისთვის — არა
  const canBook = !session || session.user.accountType === "PATIENT";

  // ჩანს მხოლოდ დადასტურებული ექიმი დამტკიცებული კლინიკიდან
  const doctors = await prisma.doctor.findMany({
    where: {
      isApproved: true,
      clinic: { isApproved: true },
    },
    include: { clinic: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.layout}>
        <h1>ექიმები</h1>
        <div className={styles.doctorCards}>
          {doctors.map((doctor) => (
            <Card key={doctor.id} className={styles.doctorCard}>
              <DoctorAvatar
                name={doctor.name}
                avatarUrl={doctor.avatarUrl}
                className={styles.avatar}
                alt={doctor.name}
              />
              <h2>
                <Link className={styles.profileLink} href={`/doctors/${doctor.id}`}>
                  {doctor.name}
                </Link>
              </h2>
              <p>{doctor.specialty}</p>
              <p>გამოცდილება: {doctor.experienceYears} წელი</p>
              <p>{doctor.clinic.name}</p>
              {doctor.languages.length > 0 && <p>ენები: {doctor.languages.join(", ")}</p>}
              {doctor.consultationFee !== null && (
                <p className={styles.fee}>კონსულტაცია: {doctor.consultationFee} ₾</p>
              )}
              {canBook && (
                // ჯავშნის გვერდი ამ ექიმით უკვე არჩეული იხსნება
                <Link className={styles.bookLink} href={`/booking?doctorId=${doctor.id}`}>
                  დაჯავშნა
                </Link>
              )}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
