import Sidebar from './components/sidebar/sidebar';
import styles from './page.module.scss';

export default function DashboardPage() {
  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
        <h1>Dashboard</h1>
      </main>
    </div>
  );
}
