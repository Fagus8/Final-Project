import styles from './Header.module.scss';

export default function Header() {
  return (
    <header className={styles.header}>
      <h2 className={styles.title}>Dashboard</h2>

      <form role="search" className={styles.searchForm}>
        <input
          type="search"
          placeholder="Search"
          className={styles.searchInput}
        />
      </form>

      <div className={styles.userActions}>
        <button type="button" className={styles.iconBtn}>❓</button>
        <button type="button" className={styles.iconBtn}>🔔</button>
        <div className={styles.avatar}>
          <img src="https://i.pravatar.cc/100?img=33" alt="User Profile" />
        </div>
      </div>
    </header>
  );
}