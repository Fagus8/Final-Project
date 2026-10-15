import Icon, { type IconName } from "@/components/ui/Icon";
import styles from "./Home.module.scss";

// სამი ნაბიჯის ტექსტები; ბარათები ამ სიიდან იხატება
const steps: { icon: IconName; title: string; text: string }[] = [
  { icon: "search", title: "იპოვე ექიმი", text: "მოძებნე სპეციალობით, სახელით ან კლინიკით." },
  { icon: "appointments", title: "აირჩიე დრო", text: "კალენდარში მხოლოდ თავისუფალი საათები ჩანს." },
  { icon: "check", title: "მიიღე დადასტურება", text: "შეტყობინება მაშინვე მოგივა — შენც და ექიმსაც." },
];

// „დაჯავშნე სამ ნაბიჯში“ — როგორ მუშაობს საიტი
export default function BookingSteps() {
  return (
    <section>
      <header className={styles.sectionHeader}>
        <div>
          <h2>დაჯავშნე სამ ნაბიჯში</h2>
          <p>აირჩიე ექიმი → დღე → თავისუფალი დრო.</p>
        </div>
      </header>
      <ol className={styles.steps}>
        {steps.map((step, index) => (
          <li key={step.title} className={styles.step}>
            <span className={styles.stepIcon}>
              <Icon name={step.icon} size={22} />
            </span>
            <span className={styles.stepNumber}>0{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
