import Link from 'next/link';
import styles from './Header.module.scss';

export default function Header() {
  return (
    <header className={styles.header}>
      <Link href="" className={styles.title}>
        <h2>Dashboard</h2>
      </Link>

      <form role="search" className={styles.searchForm}>
        <input
          type="search"
          placeholder="Search"
          className={styles.searchInput}
        />
      </form>
    </header>
  );
}
