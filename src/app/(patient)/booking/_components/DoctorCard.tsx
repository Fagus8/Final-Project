"use client";

import Icon from "@/components/ui/Icon";
import styles from "./DoctorCard.module.scss";
import type { DoctorCardProps } from "./types";

// ექიმის ბარათი ჯავშნის სიაში. „არჩევა“ ექიმს ირჩევს და ჯავშნის ფორმას ხსნის
export default function DoctorCard({
  doctor,
  selected,
  onSelect,
}: DoctorCardProps) {
  return (
    <article className={`${styles.card} ${selected ? styles.selected : ""}`}>
      {/* ფოტო, ან თუ ფოტო არ აქვს — სახელის პირველი ასო */}
      {doctor.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.avatar} src={doctor.avatarUrl} alt="" />
      ) : (
        <div className={styles.avatar} aria-hidden="true">
          {doctor.name.trim().charAt(0).toLocaleUpperCase("ka-GE")}
        </div>
      )}

      <div className={styles.details}>
        <h2>{doctor.name}</h2>
        <span className={styles.specialty}>{doctor.specialty}</span>
        <ul className={styles.meta}>
          <li>
            <Icon name="clinic" size={16} />
            {doctor.clinicName}
          </li>
          <li>
            <Icon name="clock" size={16} />
            გამოცდილება: {doctor.experienceYears} წელი
          </li>
          {/* ფასი და ენები მხოლოდ მაშინ ჩანს, თუ ექიმს შევსებული აქვს */}
          {doctor.consultationFee !== null && (
            <li>
              <Icon name="money" size={16} />
              {doctor.consultationFee} ₾
            </li>
          )}
          {doctor.languages.length > 0 && (
            <li>
              <Icon name="language" size={16} />
              {doctor.languages.join(", ")}
            </li>
          )}
        </ul>
      </div>

      <button
        className={styles.selectButton}
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(doctor.id)}
      >
        {selected ? (
          <>
            <Icon name="check" size={18} />
            არჩეულია
          </>
        ) : (
          "არჩევა"
        )}
      </button>
    </article>
  );
}
