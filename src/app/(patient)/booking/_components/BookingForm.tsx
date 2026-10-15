"use client";

import dayjs from "dayjs";
import "dayjs/locale/ka";
import Calendar from "@/components/ui/Calendar";
import styles from "./BookingForm.module.scss";
import type { BookingFormProps } from "./types";

// ჯავშნის ფორმა: თარიღი კალენდრიდან, დრო თავისუფალი სლოტებიდან.
// მონაცემებს და მოქმედებებს მშობელი კომპონენტი (BookingSection) აწვდის
export default function BookingForm({
  doctor,
  selectedDate,
  availableTimes,
  selectedTime,
  isLoadingTimes,
  isSubmitting,
  onDateChange,
  onTimeSelect,
  onConfirm,
}: BookingFormProps) {
  // არჩეული თარიღი ქართულად, მაგ: „15 ოქტომბერი 2026“
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
        {doctor.room && <> · კაბინეტი {doctor.room}</>}
      </p>

      <span className={styles.label}>თარიღი</span>
      <Calendar selectedDate={selectedDate} onSelect={onDateChange} disablePast />
      <p className={styles.datePreview}>{formattedDate}</p>

      <fieldset className={styles.times}>
        <legend className={styles.label}>თავისუფალი დრო (თბილისის დროით)</legend>
        {/* სამი მდგომარეობა: იტვირთება / დროების ღილაკები / თავისუფალი დრო არ არის */}
        {isLoadingTimes ? (
          <p className={styles.emptyTimes}>იტვირთება...</p>
        ) : availableTimes.length > 0 ? (
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
            ამ დღისთვის თავისუფალი დრო არ არის. აირჩიე სხვა დღე.
          </p>
        )}
      </fieldset>

      {/* ღილაკი აქტიურდება მხოლოდ მაშინ, როცა თარიღიც და დროც არჩეულია */}
      <button
        className={styles.confirmButton}
        disabled={!selectedDate || !selectedTime || isSubmitting}
        type="submit"
      >
        {isSubmitting ? "იგზავნება..." : "ვიზიტის დადასტურება"}
      </button>
    </form>
  );
}
