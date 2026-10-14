import Link from "next/link";
import Icon from "@/components/ui/Icon";
import styles from "./Home.module.scss";

type FeaturedDoctorsProps = {
  doctors: {
    id: string;
    name: string;
    specialty: string;
    experienceYears: number;
    clinicName: string;
  }[];
};

// ყველაზე გამოცდილი ექიმები მთავარ გვერდზე
export default function FeaturedDoctors({ doctors }: FeaturedDoctorsProps) {
  if (doctors.length === 0) {
    return null;
  }

  return (
    <section>
      <header className={styles.sectionHeader}>
        <div>
          <h2>გამოცდილი ექიმები ერთ სიაში</h2>
          <p>ნახე ექიმის სპეციალობა, გამოცდილება და კლინიკა.</p>
        </div>
        <Link href="/doctors" className={styles.textLink}>
          ყველა ექიმი
          <Icon name="arrowRight" size={16} />
        </Link>
      </header>
      <ul className={styles.doctors}>
        {doctors.map((doctor) => (
          <li key={doctor.id} className={styles.doctor}>
            <span className={styles.doctorAvatar}>
              {doctor.name.trim().charAt(0).toLocaleUpperCase("ka-GE")}
            </span>
            <div>
              <h3>{doctor.name}</h3>
              <p>{doctor.specialty}</p>
              <span className={styles.doctorMeta}>
                <Icon name="clinic" size={14} />
                {doctor.clinicName} · {doctor.experienceYears} წელი
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
