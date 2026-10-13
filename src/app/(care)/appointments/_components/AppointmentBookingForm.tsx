"use client";

import dayjs from "dayjs";
import "dayjs/locale/ka";
import styles from "./AppointmentBookingForm.module.scss";
import type { AppointmentBookingFormProps } from "./types";

export default function AppointmentBookingForm({
  doctor,
  selectedDate,
  availableTimes,
  selectedTime,
  onDateChange,
  onTimeSelect,
  onConfirm,
}: AppointmentBookingFormProps) {
  const parsedDate = dayjs(selectedDate);
  const formattedDate = parsedDate.isValid()
    ? parsedDate.locale("ka").format("D MMMM YYYY")
    : "თარიღი არჩეული არ არის";

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm();
      }}
    >
      <h2 className={styles.title}>ვიზიტის დროის არჩევა</h2>
      <p className={styles.doctor}>
        ექიმი: <strong>{doctor.name}</strong> · {doctor.specialty}
      </p>

      <label className={styles.label} htmlFor="appointment-date">
        თარიღი
      </label>
      <input
        className={styles.dateInput}
        id="appointment-date"
        type="date"
        min={dayjs().format("YYYY-MM-DD")}
        value={selectedDate}
        onChange={(event) => onDateChange(event.currentTarget.value)}
        required
      />
      <p className={styles.datePreview}>{formattedDate}</p>

      <fieldset className={styles.times}>
        <legend className={styles.label}>თავისუფალი დრო</legend>
        {availableTimes.length > 0 ? (
          <div className={styles.timeOptions}>
            {availableTimes.map((time) => (
              <button
                aria-pressed={selectedTime === time}
                className={`${styles.timeButton} ${
                  selectedTime === time ? styles.selectedTime : ""
                }`}
                key={time}
                onClick={() => onTimeSelect(time)}
                type="button"
              >
                {time}
              </button>
            ))}
          </div>
        ) : (
          <p className={styles.emptyTimes}>
            ამ დღისთვის თავისუფალი დროები ჯერ დამატებული არ არის.
          </p>
        )}
      </fieldset>

      <button
        className={styles.confirmButton}
        disabled={!selectedDate || !selectedTime}
        type="submit"
      >
        ვიზიტის დადასტურება
      </button>
    </form>
  );
}
