import Link from "next/link";
import Icon from "@/components/ui/Icon";
import styles from "./Home.module.scss";

type HeroProps = {
  // false ექიმისა და კლინიკისთვის — მათ ჯავშნის ღილაკი არ უჩანთ
  canBook: boolean;
  clinicCount: number;
  doctorCount: number;
};

// მთავარი ბლოკი: სათაური, ღილაკები, სტატისტიკა და დეკორატიული ბარათი
export default function Hero({ canBook, clinicCount, doctorCount }: HeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroText}>
        <span className={styles.eyebrow}>
          <span className={styles.pulse} />
          ონლაინ ჯავშანი 24/7
        </span>
        <h1>
          ექიმთან ვიზიტი — <span className={styles.highlight}>რიგის გარეშე</span>
        </h1>
        <p>კლინიკები და ექიმები ერთ სივრცეში. აირჩიე დრო, რომელიც შენ გაწყობს.</p>

        <div className={styles.heroActions}>
          {canBook ? (
            <Link href="/booking" className={styles.primaryButton}>
              ვიზიტის დაჯავშნა
              <Icon name="arrowRight" size={18} />
            </Link>
          ) : (
            <Link href="/dashboard" className={styles.primaryButton}>
              ჩემი კაბინეტი
              <Icon name="arrowRight" size={18} />
            </Link>
          )}
          <Link href="/clinics" className={styles.secondaryButton}>
            კლინიკები
          </Link>
        </div>

        <dl className={styles.stats}>
          <div>
            <dt>კლინიკა</dt>
            <dd>{clinicCount}</dd>
          </div>
          <div>
            <dt>ექიმი</dt>
            <dd>{doctorCount}</dd>
          </div>
          <div>
            <dt>წუთი ვიზიტზე</dt>
            <dd>30</dd>
          </div>
        </dl>
      </div>

      {/* დეკორატიული „დადასტურებული ვიზიტის“ ბარათი */}
      <div className={styles.heroVisual} aria-hidden="true">
        <div className={styles.mockCard}>
          <div className={styles.mockHeader}>
            <span className={styles.mockCheck}>
              <Icon name="check" size={18} />
            </span>
            <div>
              <strong>ვიზიტი დადასტურდა</strong>
              <span>ორშაბათი, 10:30</span>
            </div>
          </div>
          <div className={styles.mockDoctor}>
            <span className={styles.mockAvatar}>ნ</span>
            <div>
              <strong>ნინო ბერიძე</strong>
              <span>კარდიოლოგი · კაბინეტი 204</span>
            </div>
          </div>
          <div className={styles.mockSlots}>
            <span>10:00</span>
            <span className={styles.mockSlotActive}>10:30</span>
            <span>11:00</span>
            <span>11:30</span>
          </div>
        </div>
      </div>
    </section>
  );
}
