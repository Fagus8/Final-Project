import Link from "next/link";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import BookingSection from "./_components/BookingSection";
import styles from "../Patient.module.scss";

// ფილტრები URL-იდან მოდის, მაგ: /booking?specialty=კარდიოლოგი.
// ასე შედეგი ბმულით გაზიარებაც შეიძლება
type BookingPageProps = {
  searchParams: Promise<{
    specialty?: string;
    clinicId?: string;
    doctorId?: string;
    language?: string;
  }>;
};

// ვიზიტის დაჯავშნის გვერდი: ფილტრები, ექიმების სია და ჯავშნის ფორმა.
// მონაცემებს სერვერზე ვკრებთ, არჩევა და ჯავშანი კი BookingSection-შია
export default async function BookingPage({ searchParams }: BookingPageProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // დაჯავშნის გვერდი მხოლოდ პაციენტისთვისაა (კლინიკა და ექიმი აქ ვერ შემოვლენ)
  if (session.user.accountType !== "PATIENT") {
    redirect("/dashboard");
  }

  const { specialty = "", clinicId = "", doctorId, language = "" } = await searchParams;

  // ფილტრების სიებისთვის: არსებული სპეციალობები და ენები, გამეორების გარეშე (Set)
  const allDoctors = await prisma.doctor.findMany({
    where: { isApproved: true, clinic: { isApproved: true } },
    select: { specialty: true, languages: true },
  });
  const specialties = [...new Set(allDoctors.map((doctor) => doctor.specialty))].sort();
  const languages = [...new Set(allDoctors.flatMap((doctor) => doctor.languages))].sort();

  const clinics = await prisma.clinic.findMany({
    where: { isApproved: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // ძებნის პირობას ნაბიჯ-ნაბიჯ ვაწყობთ: ცარიელი ფილტრი პირობას არ ამატებს
  const where: Prisma.DoctorWhereInput = { isApproved: true, clinic: { isApproved: true } };

  if (specialty) {
    where.specialty = specialty;
  }

  if (language) {
    where.languages = { has: language };
  }

  // clinicId-ს მხოლოდ მაშინ ვიყენებთ, თუ ასეთი დამტკიცებული კლინიკა არსებობს
  if (clinics.some((clinic) => clinic.id === clinicId)) {
    where.clinicId = clinicId;
  }

  const doctors = await prisma.doctor.findMany({
    where,
    include: { clinic: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>ვიზიტის დაჯავშნა</h1>

        {/* ჩვეულებრივი GET ფორმა: გაგზავნისას ფილტრები URL-ში ჩაიწერება */}
        <form className={styles.filters} action="/booking">
          <select name="specialty" defaultValue={specialty}>
            <option value="">ყველა სპეციალობა</option>
            {specialties.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select name="clinicId" defaultValue={clinicId}>
            <option value="">ყველა კლინიკა</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
            ))}
          </select>

          {languages.length > 0 && (
            <select name="language" defaultValue={language}>
              <option value="">ნებისმიერი ენა</option>
              {languages.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          )}

          <button type="submit">ძებნა</button>
          <Link href="/booking">გასუფთავება</Link>
        </form>

        <BookingSection
          doctors={doctors.map((doctor) => ({
            id: doctor.id,
            name: doctor.name,
            specialty: doctor.specialty,
            experienceYears: doctor.experienceYears,
            room: doctor.room,
            clinicName: doctor.clinic.name,
            avatarUrl: doctor.avatarUrl,
            consultationFee: doctor.consultationFee,
            languages: doctor.languages,
          }))}
          // ?doctorId=... (ექიმის პროფილიდან მოსვლისას) ექიმს წინასწარ ირჩევს
          initialDoctorId={doctors.some((doctor) => doctor.id === doctorId) ? doctorId : undefined}
        />
      </main>
    </div>
  );
}
