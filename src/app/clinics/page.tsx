import Sidebar from '../components/sidebar/sidebar';
import Card from '../components/Card/Card';
import { prisma } from '@/lib/prisma';
import ClinicsImage from '../asset/ClinicsImage/clinicsImage';
import styles from './Clinics.module.scss';

export default async function ClinicsPage() {
  const clinics = await prisma.clinic.findMany({
    where: { isApproved: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>Clinics</h1>
        <div className={styles.clinicCards}>
          {clinics.map((clinic) => (
            <Card key={clinic.id} className={styles.clinicCard}>
              {clinic.imageUrl && (
                <ClinicsImage
                  className={styles.clinicImage}
                  src={clinic.imageUrl}
                  alt={clinic.name}
                />
              )}
              <h2>{clinic.name}</h2>
              <p>{clinic.city}</p>
              <p>{clinic.address}</p>
              <p>{clinic.phone}</p>
              <p>{clinic.specialty}</p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
