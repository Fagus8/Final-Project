"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendRequest } from "@/lib/request";
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

    // ექიმი მხოლოდ საათებს აგზავნის; ელფოსტას და კაბინეტს სერვერი მხოლოდ კლინიკისგან იღებს
    const body = isClinic ? { workStart, workEnd, email, room } : { workStart, workEnd };
    const result = await sendRequest(`/api/doctors/${doctor.id}`, "PATCH", body);

    setIsSaving(false);
    setMessage(result.message);
    if (result.ok) {
      router.refresh();
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
