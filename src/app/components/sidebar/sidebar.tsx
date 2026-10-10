'use client';

import Link from 'next/link';
import styles from './Sidebar.module.scss';
import SideBarSvg from '../../asset/sidebarSvg/sideBarSvg';

type UserRole = 'patient' | 'doctor' | 'admin';

export default function Sidebar() {
  const userRole = 'სხვა' as UserRole;

  const canAccessPatients = userRole === 'doctor' || userRole === 'admin';

 
  const patientLinkClasses = [styles.navItem];


  if (canAccessPatients) {
    patientLinkClasses.push(styles.active);
  } else {
    patientLinkClasses.push(styles.disabled);
  }

  return (
    <aside className={styles.sidebar}>
   
      <div className={styles.brand}>
        <h1>Hospital</h1>
      </div>

      {/* ნავიგაცია */}
      <nav className={styles.navMenu}>
        <ul className={styles.menu}>
        
          <li>
            <Link href="/dashboard" className={styles.navItem}>
              <span className={styles.icon}>
                <SideBarSvg name="dashboard" />
              </span>
              <span>Dashboard</span>
            </Link>
          </li>

         
          <li>
            <Link
              href="/patient-profiles"
              className={patientLinkClasses.join(' ')}
              
            >
              <span className={styles.icon}>
                <SideBarSvg name="patients" />
              </span>
              <span>Patient Profiles</span>
            </Link>
          </li>

     
          <li>
            <Link href="/doctors-performance" className={styles.navItem}>
              <span className={styles.icon}>
                <SideBarSvg name="doctors" />
              </span>
              <span>Doctors Performance</span>
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
