"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sendRequest } from "@/lib/api-client";
import BookingForm from "./BookingForm";
import DoctorCard from "./DoctorCard";
import styles from "../../Patient.module.scss";
import type { DoctorOption } from "./types";

type BookingSectionProps = {
  doctors: DoctorOption[];
  initialOptionId?: string;
};

// ჯავშნის გვერდის მთავარი ნაწილი: მარცხნივ ექიმების სია, მარჯვნივ ჯავშნის ფორმა.
// აქ ინახება არჩეული ექიმი, თარიღი და დრო და აქედან იგზავნება ჯავშანი
export default function BookingSection({ doctors, initialOptionId }: BookingSectionProps) {
  const router = useRouter();
  // არჩეული ბარათი: ექიმი + კლინიკა
  const [optionId, setOptionId] = useState(initialOptionId ?? "");
  const [date, setDate] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [time, setTime] = useState<string | null>(null);
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedDoctor = doctors.find((doctor) => doctor.id === optionId);
  const doctorId = selectedDoctor?.doctorId;
  const clinicId = selectedDoctor?.clinicId;

  // როცა ექიმი, კლინიკა ან თარიღი იცვლება, თავისუფალ დროებს თავიდან ვტვირთავთ
  useEffect(() => {
    if (!doctorId || !clinicId || !date) {
      return;
    }

    // თუ მომხმარებელმა პასუხის მოსვლამდე სხვა დღე აირჩია, ძველ პასუხს ვტოვებთ
    let ignore = false;

    fetch(`/api/doctors/${doctorId}/slots?date=${date}&clinicId=${clinicId}`)
      .then(async (response) => {
        const result = await response.json();
        if (ignore) return;
        // შეცდომა (მაგ: ექიმი აღარ იღებს) — „თავისუფალი დრო არ არის“ კი არა, მიზეზი ჩანს
        if (!response.ok) {
          setError(result.message ?? "დროების ჩატვირთვა ვერ მოხერხდა");
          return;
        }
        setTimes(result.times ?? []);
      })
      .catch(() => {
        if (!ignore) setError("დროების ჩატვირთვა ვერ მოხერხდა");
      })
      .finally(() => {
        if (!ignore) setIsLoadingTimes(false);
      });

    return () => {
      ignore = true;
    };
  }, [doctorId, clinicId, date]);

  // ექიმის ან თარიღის შეცვლისას წინა არჩევანს და შეტყობინებებს ვასუფთავებთ
  function clearSelection() {
    setTime(null);
    setTimes([]);
    setMessage("");
    setError("");
  }

  function selectDoctor(id: string) {
    setOptionId(id);
    clearSelection();
    // თარიღი თუ უკვე არჩეულია, ახალი ექიმის დროები მაშინვე ჩაიტვირთება
    if (date) {
      setIsLoadingTimes(true);
    }
  }

  function selectDate(newDate: string) {
    setDate(newDate);
    clearSelection();
    setIsLoadingTimes(true);
  }

  // ჯავშნის გაგზავნა. სერვერი კიდევ ერთხელ ამოწმებს, თავისუფალია თუ არა დრო
  async function bookAppointment() {
    if (!time) {
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await sendRequest("/api/appointments", "POST", { doctorId, clinicId, date, time });

    setIsSubmitting(false);
    // წარმატებისას დრო დაიკავა ჩვენმა ჯავშანმა, წარუმატებლობისას — შეიძლება სხვამ.
    // ორივე შემთხვევაში ამ დროს სიიდან ვაშორებთ
    setTimes((current) => current.filter((item) => item !== time));
    setTime(null);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setMessage(result.message);
    router.refresh();
  }

  return (
    <div className={styles.booking}>
      <section className={styles.doctorList} aria-label="ექიმები">
        {doctors.length === 0 ? (
          <p className={styles.empty}>ამ ფილტრით ექიმი ვერ მოიძებნა.</p>
        ) : (
          doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              selected={doctor.id === optionId}
              onSelect={selectDoctor}
            />
          ))
        )}
      </section>

      <section className={styles.formColumn}>
        {selectedDoctor ? (
          <>
            <BookingForm
              doctor={selectedDoctor}
              selectedDate={date}
              availableTimes={date ? times : []}
              selectedTime={time}
              isLoadingTimes={isLoadingTimes}
              isSubmitting={isSubmitting}
              onDateChange={selectDate}
              onTimeSelect={setTime}
              onConfirm={bookAppointment}
            />
            {message && (
              <p className={styles.success} role="status">
                {message}! <Link href="/patient-visits">ნახე „ჩემი ვიზიტები“ →</Link>
              </p>
            )}
            {error && <p className={styles.error} role="alert">{error}</p>}
          </>
        ) : (
          <p className={styles.empty}>ჯერ აირჩიე ექიმი სიიდან.</p>
        )}
      </section>
    </div>
  );
}
