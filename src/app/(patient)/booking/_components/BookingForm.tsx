"use client";

import Calendar from "@/components/ui/Calendar";
import { formatWorkDays, isWorkingDay } from "@/lib/time";
import styles from "./BookingForm.module.scss";
import type { DoctorOption } from "./types";

type BookingFormProps = {
  doctor: DoctorOption;
  // "2026-10-15" ფორმატით
  selectedDate: string;
  availableTimes: string[];
  // "10:30" ან null, თუ დრო ჯერ არ აურჩევია
  selectedTime: string | null;
  isLoadingTimes: boolean;
  isSubmitting: boolean;
  onDateChange: (date: string) => void;
  onTimeSelect: (time: string) => void;
  onConfirm: () => void;
};

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
      <p className={styles.datePreview}>იღებს: {formatWorkDays(doctor.workDays)}</p>

      <span className={styles.label}>თარიღი</span>
      {/* არასამუშაო და დასვენების დღეები გამორთულია */}
      <Calendar
        selectedDate={selectedDate}
        onSelect={onDateChange}
        disablePast
        isDayDisabled={(date) => !isWorkingDay(doctor, date)}
      />

      <fieldset className={styles.times}>
        <legend className={styles.label}>თავისუფალი დრო (თბილისის დროით)</legend>
        {/* ოთხი მდგომარეობა: დღე არ არის არჩეული / იტვირთება / დროების ღილაკები / თავისუფალი დრო არ არის */}
        {!selectedDate ? (
          <p className={styles.emptyTimes}>ჯერ აირჩიე დღე კალენდარში.</p>
        ) : isLoadingTimes ? (
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
