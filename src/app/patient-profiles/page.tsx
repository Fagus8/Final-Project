import Sidebar from '../components/sidebar/sidebar';
import { mockPatients } from '@/data/mockData';
import styles from './PatientProfiles.module.scss';

export default function PatientProfilesPage() {
  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 style={{ marginBottom: 20 }}>პაციენტის პროფილი</h1>
        <section className={styles.profileCard}>
          {mockPatients.length === 0 ? (
            <p>პაციენტების ინფორმაცია ჯერ დამატებული არ არის.</p>
          ) : mockPatients.map((patient) => (
            <dl key={patient.id} className={styles.details}>
              <div><dt>სახელი</dt><dd>{patient.name}</dd></div>
              <div><dt>ასაკი</dt><dd>{patient.age}</dd></div>
              <div><dt>სისხლის ჯგუფი</dt><dd>{patient.bloodType || '—'}</dd></div>
              <div><dt>ბოლო ვიზიტი</dt><dd>{patient.lastVisit || '—'}</dd></div>
            </dl>
          ))}
        </section>
      </main>
    </div>
  );
}
