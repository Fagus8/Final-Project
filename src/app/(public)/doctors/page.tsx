import Link from 'next/link';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Card from '@/components/ui/Card';
import Sidebar from '@/components/layout/Sidebar';
import styles from './Doctors.module.scss';

export default async function DoctorsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  // „დაჯავშნა“ ღილაკი ჩანს სტუმრისთვის და პაციენტისთვის, კლინიკისა და ექიმისთვის — არა
  const canBook = !session || session.user.accountType === 'PATIENT';

  const doctors = await prisma.doctor.findMany({
    where: {
  isApproved: true,
  clinic: { isApproved: true },
   },
    include: { clinic: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.layout}>
        <h1>ექიმები</h1>
        <div className={styles.doctorCards}>
          {doctors.map((doctor) => (
            <Card key={doctor.id} className={styles.doctorCard}>
              {doctor.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.avatar} src={doctor.avatarUrl} alt={doctor.name} />
              ) : (
                <span className={styles.initial} aria-hidden="true">
                  {doctor.name.trim().charAt(0).toLocaleUpperCase('ka-GE')}
                </span>
              )}
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
