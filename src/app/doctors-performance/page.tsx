import { mockDoctors } from '@/data/mockData';
import Card from '../components/Card/Card';
import Sidebar from '../components/sidebar/sidebar';
import styles from './DoctorsPerformance.module.scss';

export default function DoctorsPerformancePage() {
  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.layout}>
        <h1>ექიმები</h1>
        <div className={styles.doctorCards}>
          {mockDoctors.map((doctor) => (
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
