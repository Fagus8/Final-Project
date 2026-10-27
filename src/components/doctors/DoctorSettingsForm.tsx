"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendRequest } from "@/lib/api-client";
import styles from "@/components/ui/InlineForm.module.scss";

type DoctorSettingsFormProps = {
  doctor: {
    id: string;
    workStart: string;
    workEnd: string;
    room: string | null;
  };
  // კლინიკას შეუძლია კაბინეტის შეცვლაც
  isClinic?: boolean;
};

// ექიმის სამუშაო საათების ფორმა („ჩემი განრიგი“ და „კლინიკის მართვა“).
// ამ საათებიდან იქმნება 30-წუთიანი სლოტები ჯავშნისთვის
export default function DoctorSettingsForm({ doctor, isClinic = false }: DoctorSettingsFormProps) {
  const router = useRouter();
  const [workStart, setWorkStart] = useState(doctor.workStart);
  const [workEnd, setWorkEnd] = useState(doctor.workEnd);
  const [room, setRoom] = useState(doctor.room ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    // ექიმი მხოლოდ საათებს აგზავნის; კაბინეტს სერვერი მხოლოდ კლინიკისგან იღებს
    const body = isClinic ? { workStart, workEnd, room } : { workStart, workEnd };
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
        <label>
          კაბინეტი
          <input type="text" value={room} placeholder="მაგ: 204" onChange={(e) => setRoom(e.target.value)} />
        </label>
      )}

      <button type="submit" disabled={isSaving}>
        {isSaving ? "ინახება..." : "შენახვა"}
      </button>
      {message && <p className={styles.message}>{message}</p>}
    </form>
  );
}
