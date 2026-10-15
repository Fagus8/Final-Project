"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./DoctorScheduleForm.module.scss";

type DoctorScheduleFormProps = {
  doctor: {
    id: string;
    workStart: string;
    workEnd: string;
    email: string | null;
    room: string | null;
  };
  // კლინიკას შეუძლია ელფოსტისა და კაბინეტის შეცვლაც
  isClinic?: boolean;
};

// ექიმის სამუშაო საათების ფორმა („ჩემი განრიგი“ და „კლინიკის მართვა“).
// ამ საათებიდან იქმნება 30-წუთიანი სლოტები ჯავშნისთვის
export default function DoctorScheduleForm({ doctor, isClinic = false }: DoctorScheduleFormProps) {
  const router = useRouter();
  const [workStart, setWorkStart] = useState(doctor.workStart);
  const [workEnd, setWorkEnd] = useState(doctor.workEnd);
  const [email, setEmail] = useState(doctor.email ?? "");
  const [room, setRoom] = useState(doctor.room ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/doctors/${doctor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // ექიმი მხოლოდ საათებს აგზავნის; ელფოსტას და კაბინეტს სერვერი მხოლოდ კლინიკისგან იღებს
        body: JSON.stringify(isClinic ? { workStart, workEnd, email, room } : { workStart, workEnd }),
      });
      const result = await response.json();

      setMessage(result.message);
      if (response.ok) {
        router.refresh();
      }
    } catch {
      setMessage("სერვერთან დაკავშირება ვერ მოხერხდა");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={save}>
      <label>
        მუშაობის დაწყება
        {/* step="1800" — 30 წუთის ბიჯი (წამებში) */}
        <input type="time" step="1800" required value={workStart} onChange={(e) => setWorkStart(e.target.value)} />
      </label>
      <label>
        დასრულება
        <input type="time" step="1800" required value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} />
      </label>

      {isClinic && (
        <>
          <label>
            კაბინეტი
            <input type="text" value={room} placeholder="მაგ: 204" onChange={(e) => setRoom(e.target.value)} />
          </label>
          <label>
            ექიმის ელფოსტა
            <input type="email" value={email} placeholder="ანგარიშის დასაკავშირებლად" onChange={(e) => setEmail(e.target.value)} />
          </label>
        </>
      )}

      <button type="submit" disabled={isSaving}>
        {isSaving ? "ინახება..." : "შენახვა"}
      </button>
      {message && <p className={styles.message}>{message}</p>}
    </form>
  );
}
