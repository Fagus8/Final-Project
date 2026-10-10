import Sidebar from '../components/sidebar/sidebar';
import { mockDoctors } from '@/data/mockData';
import styles from './DoctorsPerformance.module.scss';

export default function DoctorsPerformancePage() {
  const approvedDoctors = mockDoctors
    .filter((doctor) => doctor.isApproved)
    .sort((first, second) => second.rating - first.rating);

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <h1>Doctors Performance</h1>
        <p className={styles.intro}>ექიმების შეფასებები და გამოცდილება.</p>

        {approvedDoctors.length === 0 ? (
          <p className={styles.message}>
            ექიმების ინფორმაცია ჯერ დამატებული არ არის.
          </p>
        ) : (
          <div className={styles.grid}>
            {approvedDoctors.map((doctor) => (
              <article key={doctor.id} className={styles.card}>
                {doctor.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className={styles.avatar} src={doctor.avatarUrl} alt="" />
                ) : (
                  <div className={styles.avatarFallback} aria-hidden="true">
                    {doctor.name.slice(0, 1)}
                  </div>
                )}
                <div>
                  <h2>{doctor.name}</h2>
                  <p>{doctor.specialty}</p>
                  <p>⭐ {doctor.rating} · {doctor.experienceYears} წელი გამოცდილება</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
