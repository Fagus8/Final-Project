import Sidebar from '../components/sidebar/sidebar';
import { mockPatients } from '@/data/mockData';

export default function PatientProfilesPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f7fb' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 32, color: '#172033' }}>
        <h1 style={{ marginBottom: 20 }}>პაციენტის პროფილი</h1>
        <section style={{ maxWidth: 700, padding: 24, borderRadius: 12, background: '#fff' }}>
          {mockPatients.length === 0 ? (
            <p>პაციენტების ინფორმაცია ჯერ დამატებული არ არის.</p>
          ) : mockPatients.map((patient) => (
            <dl key={patient.id} style={{ display: 'grid', gap: 12 }}>
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
