import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BookingSection from "./_components/BookingSection";
import styles from "../Patient.module.scss";

type BookingPageProps = {
  searchParams: Promise<{
    q?: string;
    specialty?: string;
    clinicId?: string;
    doctorId?: string;
  }>;
};

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // დაჯავშნის გვერდი მხოლოდ პაციენტისთვისაა (კლინიკა და ექიმი აქ ვერ შემოვლენ)
  if (session.user.accountType !== "PATIENT") {
    redirect("/dashboard");
  }

  const { q = "", specialty = "", clinicId = "", doctorId } = await searchParams;

  // ფილტრების სიებისთვის
  const allDoctors = await prisma.doctor.findMany({
    where: { isApproved: true, clinic: { isApproved: true } },
    select: { specialty: true },
  });
  const specialties = [...new Set(allDoctors.map((doctor) => doctor.specialty))].sort();

  const clinics = await prisma.clinic.findMany({
    where: { isApproved: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  // ექიმების ძებნა სახელის, სპეციალობისა და კლინიკის მიხედვით
  const doctors = await prisma.doctor.findMany({
    where: {
      isApproved: true,
      clinic: { isApproved: true },
      ...(specialty ? { specialty } : {}),
      ...(clinics.some((clinic) => clinic.id === clinicId) ? { clinicId } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { specialty: { contains: q, mode: "insensitive" } },
              { clinic: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: { clinic: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>ვიზიტის დაჯავშნა</h1>

        <form className={styles.filters} action="/booking">
          <input type="search" name="q" defaultValue={q} placeholder="ექიმის ან კლინიკის სახელი" />

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
          }))}
          initialDoctorId={doctors.some((doctor) => doctor.id === doctorId) ? doctorId : undefined}
        />
      </main>
    </div>
  );
}
