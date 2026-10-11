import Link from 'next/link';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import styles from './Header.module.scss';

export default async function Header() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.title} aria-label="Hospital — მთავარ გვერდზე დაბრუნება">
        Hospital
      </Link>

      <form role="search" className={styles.searchForm}>
        <input
          type="search"
          placeholder="ძიება"
          aria-label="ძიება"
          className={styles.searchInput}
        />
      </form>

      <nav className={styles.actions} aria-label="ანგარიში">
        {session ? (
          <Link href="/dashboard" className={styles.profileLink}>
            <span className={styles.avatar} aria-hidden="true">
              {session.user.name.trim().charAt(0).toUpperCase()}
            </span>
            <span>{session.user.name}</span>
          </Link>
        ) : (
          <>
            <Link href="/register" className={styles.actionLink}>
              რეგისტრაცია
            </Link>
            <Link href="/login" className={styles.actionLink}>
              შესვლა
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}