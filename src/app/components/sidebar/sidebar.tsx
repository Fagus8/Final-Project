import Link from 'next/link';
import styles from './Sidebar.module.scss';

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <h1>Hospital</h1>
        <button className={styles.toggleBtn} aria-label="Toggle Sidebar">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
      </div>

      <nav className={styles.navMenu}>
        <ul>
          <li>
            <Link href="/dashboard" className={`${styles.navItem} ${styles.active}`}>
              <span className={styles.icon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link href="/patient-profiles" className={styles.navItem}>
              <span className={styles.icon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </span>
              <span>Patient Profiles</span>
            </Link>
          </li>
          <li>
            <Link href="/doctors-performance" className={styles.navItem}>
              <span className={styles.icon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
              </span>
              <span>Doctor&apos;s Performance</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}