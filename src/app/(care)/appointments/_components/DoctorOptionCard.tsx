"use client";

import SidebarIcon from "@/components/icons/SidebarIcon";
import styles from "./DoctorOptionCard.module.scss";
import type { DoctorOptionCardProps } from "./types";

export default function DoctorOptionCard({
  doctor,
  selected,
  onSelect,
}: DoctorOptionCardProps) {
  return (
    <article className={`${styles.card} ${selected ? styles.selected : ""}`}>
      <div className={styles.avatar} aria-hidden="true">
        {doctor.name.trim().charAt(0).toLocaleUpperCase("ka-GE")}
      </div>

      <div className={styles.details}>
        <h2>{doctor.name}</h2>
        <p>{doctor.specialty}</p>
        <p>გამოცდილება: {doctor.experienceYears} წელი</p>
        <p>{doctor.clinicName}</p>
      </div>

      <button
        className={styles.selectButton}
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(doctor.id)}
      >
        <SidebarIcon name="doctors" />
        {selected ? "არჩეულია" : "აირჩიე ექიმი"}
      </button>
    </article>
  );
}
