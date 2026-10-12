import { headers } from 'next/headers';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import styles from './Sidebar.module.scss';
import SideBarSvg from '../../asset/sidebarSvg/sideBarSvg';
import ClinicsSvg from '../../asset/ClinicsImage/ClinicsSvg';

export default async function Sidebar() {
  const session = await auth.api.getSession({ headers: await headers() });
  const canAccessPatients = session?.user.role === 'admin';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Link className={styles.home} href="/">Hospital</Link>
      </div>

      <nav className={styles.navMenu}>
        <ul className={styles.menu}>
          <li>
            <Link href="/dashboard" className={styles.navItem}>
              <span className={styles.icon}>
                <SideBarSvg name="dashboard" />
              </span>
              <span>პირადი კაბინეტი</span>
            </Link>
          </li>

          <li>
            <Link href="/doctors-performance" className={styles.navItem}>
              <span className={styles.icon}>
                <SideBarSvg name="doctors" />
              </span>
              <span>ექიმები</span>
            </Link>
          </li>
          <li>
            <Link href="/clinics" className={styles.navItem}>
              <span className={styles.icon}>
                <ClinicsSvg />
              </span>
              <span>კლინიკები</span>
            </Link>
          </li>
          {canAccessPatients && (
            <li>
              <Link href="/patient-profiles" className={styles.navItem}>
                <span className={styles.icon}>
                  <SideBarSvg name="patients" />
                </span>
                <span>პაციენტების პროფილები</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}
