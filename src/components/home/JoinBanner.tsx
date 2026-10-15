import Link from "next/link";
import Icon from "@/components/ui/Icon";
import styles from "./Home.module.scss";

// მოწვევა ექიმებისა და კლინიკებისთვის (მთავარ გვერდზე მხოლოდ სტუმარს უჩანს)
export default function JoinBanner() {
  return (
    <section className={styles.callToAction}>
      <div>
        <h2>ექიმი ან კლინიკა ხარ?</h2>
        <p>შემოგვიერთდი და მართე განრიგი, კაბინეტები და ვიზიტები ონლაინ.</p>
      </div>
      <Link href="/register" className={styles.ctaButton}>
        შემოგვიერთდი
        <Icon name="arrowRight" size={18} />
      </Link>
    </section>
  );
}
