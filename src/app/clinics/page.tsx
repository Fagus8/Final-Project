import Sidebar from "../components/sidebar/sidebar";
import Card from '../components/Card/Card';
import styles from './Clinics.module.scss';

export default function ClinicsPage() {
  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>Clinics</h1>
      </main>
    </div>
  );
}
