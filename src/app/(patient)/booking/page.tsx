import Link from "next/link";
import { redirect } from "next/navigation";
import Sidebar from "@/components/navigation/Sidebar";
import type { Prisma } from "@/generated/prisma/client";
import { visibleClinicWhere, visibleDoctorWhere } from "@/lib/doctors";
import { loginUrl } from "@/lib/next-url";
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
    q?: string;
  }>;
};

// ვიზიტის დაჯავშნის გვერდი: ფილტრები, ექიმების სია და ჯავშნის ფორმა.
// მონაცემებს სერვერზე ვკრებთ, არჩევა და ჯავშანი კი BookingSection-შია
export default async function BookingPage({ searchParams }: BookingPageProps) {
  const session = await getSession();
  const filters = await searchParams;

  // შესვლის შემდეგ იმავე ექიმთან და ფილტრებთან დავბრუნდებით
  if (!session) {
    const query = new URLSearchParams(
      Object.entries(filters).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    ).toString();
    redirect(loginUrl(query ? `/booking?${query}` : "/booking"));
  }

  // დაჯავშნის გვერდი მხოლოდ პაციენტისთვისაა (კლინიკა და ექიმი აქ ვერ შემოვლენ)
  if (session.user.accountType !== "PATIENT") {
    redirect("/dashboard");
  }

  const { specialty = "", clinicId = "", doctorId, language = "", q = "" } = filters;

  // ფილტრების სიებისთვის: არსებული სპეციალობები და ენები, გამეორების გარეშე (Set)
  const allDoctors = await prisma.doctor.findMany({
    where: visibleDoctorWhere,
    select: { specialty: true, languages: true },
  });
  const specialties = [...new Set(allDoctors.map((doctor) => doctor.specialty))].sort();
  const languages = [...new Set(allDoctors.flatMap((doctor) => doctor.languages))].sort();

  const clinics = await prisma.clinic.findMany({
    where: { isApproved: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // ძებნის პირობას ნაბიჯ-ნაბიჯ ვაწყობთ: ცარიელი ფილტრი პირობას არ ამატებს.
  // სიის ელემენტი = ექიმის ხილული კავშირი კლინიკასთან (ექიმი + კლინიკა + ამ კლინიკის გრაფიკი)
  const doctorWhere: Prisma.DoctorWhereInput = {};
  const where: Prisma.DoctorClinicWhereInput = { ...visibleClinicWhere, doctor: doctorWhere };

  if (specialty) {
    doctorWhere.specialty = specialty;
  }

  // ექიმის სახელით ძებნა (დიდი/პატარა ასოს მიუხედავად)
  if (q.trim()) {
    doctorWhere.name = { contains: q.trim(), mode: "insensitive" };
  }

  if (language) {
    doctorWhere.languages = { has: language };
  }

  // clinicId-ს მხოლოდ მაშინ ვიყენებთ, თუ ასეთი დამტკიცებული კლინიკა არსებობს
  if (clinics.some((clinic) => clinic.id === clinicId)) {
    where.clinicId = clinicId;
  }

  const memberships = await prisma.doctorClinic.findMany({
    where,
    include: { doctor: true, clinic: { select: { name: true } } },
    orderBy: [{ doctor: { name: "asc" } }, { clinic: { name: "asc" } }],
  });

  // ?doctorId=... (ექიმის პროფილიდან მოსვლისას) ექიმს წინასწარ ირჩევს —
  // ?clinicId-ით მითითებულ კლინიკაში, თორემ პირველში
  const initialOption =
    memberships.find((item) => item.doctorId === doctorId && item.clinicId === clinicId) ??
    memberships.find((item) => item.doctorId === doctorId);

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>ვიზიტის დაჯავშნა</h1>

        {/* ჩვეულებრივი GET ფორმა: გაგზავნისას ფილტრები URL-ში ჩაიწერება */}
        <form className={styles.filters} action="/booking">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="ექიმის სახელი"
            aria-label="ექიმის სახელი"
          />

          <select name="specialty" defaultValue={specialty} aria-label="სპეციალობა">
            <option value="">ყველა სპეციალობა</option>
            {specialties.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select name="clinicId" defaultValue={clinicId} aria-label="კლინიკა">
            <option value="">ყველა კლინიკა</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
            ))}
          </select>

          {languages.length > 0 && (
            <select name="language" defaultValue={language} aria-label="ენა">
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
          doctors={memberships.map(({ doctor, clinic, ...membership }) => ({
            id: membership.id,
            doctorId: doctor.id,
            clinicId: membership.clinicId,
            name: doctor.name,
            specialty: doctor.specialty,
            experienceYears: doctor.experienceYears,
            room: membership.room,
            clinicName: clinic.name,
            avatarUrl: doctor.avatarUrl,
            consultationFee: doctor.consultationFee,
            languages: doctor.languages,
            workDays: membership.workDays,
            daysOff: membership.daysOff,
          }))}
          initialOptionId={initialOption?.id}
        />
      </main>
    </div>
  );
}
