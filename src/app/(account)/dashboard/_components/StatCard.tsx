import Link from "next/link";
import styles from "../../Account.module.scss";

type StatCardProps = {
  label: string;
  value: number;
  // დაჭერისას სად გადავიდეს (მაგ: დეტალური სია)
  href: string;
};

// სტატისტიკის ბარათი პირად კაბინეტში: წარწერა, რიცხვი და ბმული
export default function StatCard({ label, value, href }: StatCardProps) {
  return (
    <Link href={href} className={`${styles.detailCard} ${styles.statLink}`}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </Link>
  );
}
