import Sidebar from "@/components/layout/Sidebar";
import { visibleDoctorWhere } from "@/lib/doctors";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import BookingSteps from "./BookingSteps";
import FeaturedDoctors from "./FeaturedDoctors";
import Hero from "./Hero";
import JoinBanner from "./JoinBanner";
import styles from "./Home.module.scss";

// მთავარი გვერდი: მონაცემებს ბაზიდან იღებს და ნაწილებს აწყობს
export default async function HomePage() {
  const session = await getSession();
  // დაჯავშნის ბლოკი კლინიკასა და ექიმს არ უჩანს
  const canBook = !session || session.user.accountType === "PATIENT";

  // რეალური რიცხვები ბაზიდან. ექიმებიდან ითვლება მხოლოდ საჯაროდ ხილული
  const [clinicCount, doctorCount, doctors] = await Promise.all([
    prisma.clinic.count({ where: { isApproved: true } }),
    prisma.doctor.count({ where: visibleDoctorWhere }),
    prisma.doctor.findMany({
      where: visibleDoctorWhere,
      include: { clinic: true },
      orderBy: { experienceYears: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.page}>
        <Hero canBook={canBook} clinicCount={clinicCount} doctorCount={doctorCount} />
        {canBook && <BookingSteps />}
        <FeaturedDoctors
          doctors={doctors.map((doctor) => ({
            id: doctor.id,
            name: doctor.name,
            specialty: doctor.specialty,
            experienceYears: doctor.experienceYears,
            clinicName: doctor.clinic.name,
            avatarUrl: doctor.avatarUrl,
          }))}
        />
        {/* მოწვევა — მხოლოდ სტუმრისთვის */}
        {!session && <JoinBanner />}
      </main>
    </div>
  );
}
