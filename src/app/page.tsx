import Sidebar from './components/sidebar/sidebar';
import styles from './page.module.scss';
import Header from './components/Header/header';

export default function DashboardPage() {
  return (
    <div className={styles.dashboardContainer}>
      <Sidebar />
      <main className={styles.mainContent}>
       <Header></Header>
      </main>
    </div>
  );
}
