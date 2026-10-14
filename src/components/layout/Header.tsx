import Link from 'next/link';
import { headers } from 'next/headers';
import Icon from '@/components/ui/Icon';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import styles from './Header.module.scss';
import LogoutButton from "./LogoutButton";

const accountTypeLabels: Record<string, string> = {
  PATIENT: "პაციენტი",
  DOCTOR: "ექიმი",
  CLINIC: "კლინიკა",
};

export default async function Header() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // წაუკითხავი შეტყობინებების რაოდენობა
  const unreadCount = session
    ? await prisma.notification.count({
        where: { userId: session.user.id, isRead: false },
      })
    : 0;

  const canBook = !session || session.user.accountType === "PATIENT";

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="medical.ge — მთავარ გვერდზე დაბრუნება">
        <span className={styles.logo}>
          <Icon name="logo" size={18} />
        </span>
        <span>
          medical<span className={styles.brandAccent}>.ge</span>
        </span>
      </Link>

      {/* ძიება დაჯავშნის გვერდზე გადადის, ამიტომ კლინიკასა და ექიმს არ უჩანს */}
      {canBook ? (
        <form role="search" className={styles.searchForm} action="/booking">
          <span className={styles.searchIcon}>
            <Icon name="search" size={18} />
          </span>
          <input
            type="search"
            name="q"
            placeholder="მოძებნე ექიმი, სპეციალობა ან კლინიკა"
            aria-label="ძიება"
            className={styles.searchInput}
          />
        </form>
      ) : (
        <div className={styles.searchForm} />
      )}

      <nav className={styles.actions} aria-label="ანგარიში">
        {session ? (
          <>
            <Link
              href="/notifications"
              className={styles.iconButton}
              aria-label={`შეტყობინებები${unreadCount > 0 ? ` (${unreadCount} ახალი)` : ""}`}
              title="შეტყობინებები"
            >
              <Icon name="bell" />
              {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </Link>

            <Link href="/dashboard" className={styles.profileLink}>
              <span className={styles.avatar} aria-hidden="true">
                {session.user.name.trim().charAt(0).toUpperCase()}
              </span>
              <span className={styles.profileText}>
                <span className={styles.profileName}>{session.user.name}</span>
                <span className={styles.profileRole}>
                  {session.user.role === "admin"
                    ? "ადმინისტრატორი"
                    : accountTypeLabels[session.user.accountType] ?? ""}
                </span>
              </span>
            </Link>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" className={styles.ghostLink}>
              შესვლა
            </Link>
            <Link href="/register" className={styles.primaryLink}>
              რეგისტრაცია
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
