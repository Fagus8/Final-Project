import { prisma } from '@/lib/prisma';
import Card from '@/components/ui/Card';
import Sidebar from '@/components/layout/Sidebar';
import styles from './DoctorsPerformance.module.scss';

export default async function DoctorsPerformancePage() {
  const doctors = await prisma.doctor.findMany({
    where: {
  isApproved: true,
  clinic: { isApproved: true },
   },
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
              {doctor.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.avatar} src={doctor.avatarUrl} alt={doctor.name} />
              )}
              <h2>{doctor.name}</h2>
              <p>{doctor.specialty}</p>
              <p>გამოცდილება: {doctor.experienceYears} წელი</p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
