import Link from "next/link";
import Sidebar from "@/components/navigation/Sidebar";
import Card from "@/components/ui/Card";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
import filters from "@/components/ui/Filters.module.scss";
import type { Prisma } from "@/generated/prisma/client";
import { clinicNames, visibleClinicsInclude, visibleDoctorWhere } from "@/lib/doctors";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import styles from "./Doctors.module.scss";

// ექიმების სია, ყველასთვის ღია. ძებნა სახელით და სპეციალობით (?q=...&specialty=...)
export default async function DoctorsPage({ searchParams }: PageProps<"/doctors">) {
  const session = await getSession();
  // „დაჯავშნა“ ღილაკი ჩანს სტუმრისთვის და პაციენტისთვის, კლინიკისა და ექიმისთვის — არა
  const canBook = !session || session.user.accountType === "PATIENT";

  const { q, specialty } = await searchParams;
  const search = typeof q === "string" ? q.trim() : "";
  const selectedSpecialty = typeof specialty === "string" ? specialty : "";

  // ჩანს მხოლოდ დარეგისტრირებული, დადასტურებული ექიმი დამტკიცებული კლინიკიდან
  const where: Prisma.DoctorWhereInput = { ...visibleDoctorWhere };
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (selectedSpecialty) {
    where.specialty = selectedSpecialty;
  }

  const [doctors, allSpecialties] = await Promise.all([
    prisma.doctor.findMany({
      where,
      include: { clinics: visibleClinicsInclude },
      orderBy: { name: "asc" },
    }),
    // ფილტრის სია: არსებული სპეციალობები, გამეორების გარეშე
    prisma.doctor.findMany({
      where: visibleDoctorWhere,
      select: { specialty: true },
      distinct: ["specialty"],
      orderBy: { specialty: "asc" },
    }),
  ]);

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.layout}>
        <h1>ექიმები</h1>

        <form className={filters.filters} action="/doctors">
          <input type="search" name="q" defaultValue={search} placeholder="ექიმის სახელი" aria-label="ექიმის სახელი" />
          <select name="specialty" defaultValue={selectedSpecialty} aria-label="სპეციალობა">
            <option value="">ყველა სპეციალობა</option>
            {allSpecialties.map((item) => (
              <option key={item.specialty} value={item.specialty}>{item.specialty}</option>
            ))}
          </select>
          <button type="submit">ძებნა</button>
          {(search || selectedSpecialty) && <Link href="/doctors">გასუფთავება</Link>}
        </form>

        {doctors.length === 0 ? (
          <p className={filters.empty}>
            {search || selectedSpecialty ? "ამ ძებნით ექიმი ვერ მოიძებნა." : "ექიმები ჯერ არ არიან დამატებული."}
          </p>
        ) : (
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
                <p>{clinicNames(doctor)}</p>
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
        )}
      </main>
    </div>
  );
}
