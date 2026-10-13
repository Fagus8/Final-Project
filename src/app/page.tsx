import Sidebar from "@/components/layout/Sidebar";
import styles from "./page.module.scss";

export default function HomePage() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.container}>
            <h1>იპოვე შენთვის შესაფერისი კლინიკა</h1>
            {/* აქ დაამატე მოკლე აღწერა და მოქმედების ღილაკები. */}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <h1>დაჯავშნე ვიზიტი</h1>
              {/* აქ დაამატე მოკლე აღწერა. */}
            </header>
            <div className={styles.clinicGrid}>
              {/* აქ განათავსე გამორჩეული კლინიკების ბარათები. */}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.container}>
            <header className={styles.sectionHeader}>
              <h1>გაიცანი ჩვენი ექიმები </h1>
              {/* აქ დაამატე მოკლე აღწერა. */}
            </header>
            <div className={styles.featureGrid}>
              {/* აქ განათავსე საიტის შესაძლებლობების ბლოკები. */}
            </div>
          </div>
        </section>

        <section className={styles.callToAction}>
          <div className={styles.container}>
            <h1>Future !!!</h1>
            {/* აქ დაამატე დასკვნითი ტექსტი და მოქმედების ღილაკი. */}
          </div>
        </section>
      </main>
    </div>
  );
}
