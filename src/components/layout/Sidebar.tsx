import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import styles from "./Sidebar.module.scss";
import SidebarIcon from "@/components/icons/SidebarIcon";

export default async function Sidebar() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const isAdmin = session?.user.role === "admin";
  const isPatient = session?.user.accountType === "PATIENT";

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.navMenu}>
        <ul className={styles.menu}>
          <li>
            <Link href="/dashboard" className={styles.navItem}>
              <span className={styles.icon}>
                <SidebarIcon name="dashboard" />
              </span>
              <span>მიმოხილვა</span>
            </Link>
          </li>

          {isAdmin && (
            <li>
              <Link href="/patient-profiles" className={styles.navItem}>
                <span className={styles.icon}>
                  <SidebarIcon name="patients" />
                </span>
                <span>პაციენტები</span>
              </Link>
            </li>
          )}

          <li>
            <Link href="/doctors-performance" className={styles.navItem}>
              <span className={styles.icon}>
                <SidebarIcon name="doctors" />
              </span>
              <span>ექიმები</span>
            </Link>
          </li>
          <li>
            <Link href="/clinics" className={styles.navItem}>
              <span className={styles.icon}>
                <SidebarIcon name="clinic" />
              </span>
              <span>კლინიკები</span>
            </Link>
          </li>

          {isPatient && !isAdmin && (
            <>
              <li>
                <Link href="/appointments" className={styles.navItem}>
                  <span className={styles.icon}>
                    <SidebarIcon name="appointments" />
                  </span>
                  <span>ჩემი ვიზიტები</span>
                </Link>
              </li>
              <li>
                <Link href="/profile" className={styles.navItem}>
                  <span className={styles.icon}>
                    <SidebarIcon name="profile" />
                  </span>
                  <span>ჩემი პროფილი</span>
                </Link>
              </li>
            </>
          )}

          {isAdmin && (
            <li>
              <Link href="/admin/clinics" className={styles.navItem}>
                <span className={styles.icon}>
                  <SidebarIcon name="clinic" />
                </span>
                <span>კლინიკების მართვა</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}
