"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { sendRequest } from "@/lib/api-client";
import { formatLongDay, WEEK_ORDER, WEEKDAY_NAMES } from "@/lib/time";
import styles from "@/components/ui/InlineForm.module.scss";

type DoctorSettingsFormProps = {
  doctor: {
    id: string;
    workStart: string;
    workEnd: string;
    workDays: number[];
    daysOff: string[];
    room: string | null;
  };
  // კლინიკას შეუძლია კაბინეტის შეცვლაც
  isClinic?: boolean;
};

// ექიმის გრაფიკის ფორმა („ჩემი განრიგი“ და „კლინიკის მართვა“): საათები,
// სამუშაო დღეები და დასვენების დღეები. აქედან იქმნება 30-წუთიანი სლოტები ჯავშნისთვის
export default function DoctorSettingsForm({ doctor, isClinic = false }: DoctorSettingsFormProps) {
  const router = useRouter();
  const id = useId();
  const [workStart, setWorkStart] = useState(doctor.workStart);
  const [workEnd, setWorkEnd] = useState(doctor.workEnd);
  const [workDays, setWorkDays] = useState(doctor.workDays);
  const [daysOff, setDaysOff] = useState(doctor.daysOff);
  const [newDayOff, setNewDayOff] = useState("");
  const [room, setRoom] = useState(doctor.room ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function toggleDay(day: number) {
    setWorkDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  }

  function addDayOff() {
    if (newDayOff && !daysOff.includes(newDayOff)) {
      setDaysOff((current) => [...current, newDayOff].sort());
    }
    setNewDayOff("");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setResult(null);

    // კაბინეტს სერვერი მხოლოდ კლინიკისგან იღებს
    const body = { workStart, workEnd, workDays, daysOff, ...(isClinic && { room }) };
    const saved = await sendRequest(`/api/doctors/${doctor.id}`, "PATCH", body);

    setIsSaving(false);
    setResult(saved);
    if (saved.ok) {
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

      <fieldset className={styles.checks}>
        <legend>სამუშაო დღეები</legend>
        {WEEK_ORDER.map((day) => (
          <label key={day}>
            <input type="checkbox" checked={workDays.includes(day)} onChange={() => toggleDay(day)} />
            {WEEKDAY_NAMES[day]}
          </label>
        ))}
      </fieldset>

      <label htmlFor={`${id}-day-off`}>
        დასვენების / შვებულების დღე
        <input
          id={`${id}-day-off`}
          type="date"
          value={newDayOff}
          onChange={(e) => setNewDayOff(e.target.value)}
        />
      </label>
      <button type="button" onClick={addDayOff} disabled={!newDayOff}>
        დამატება
      </button>

      {daysOff.length > 0 ? (
        <ul className={styles.chips} aria-label="დასვენების დღეები">
          {daysOff.map((day) => (
            <li key={day}>
              {formatLongDay(day)}
              <button
                type="button"
                aria-label={`${formatLongDay(day)} — წაშლა`}
                onClick={() => setDaysOff((current) => current.filter((item) => item !== day))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.hint}>დასვენების დღე არ არის დამატებული. ამ დღეებში ჯავშანი არ მიიღება.</p>
      )}

      <button type="submit" disabled={isSaving}>
        {isSaving ? "ინახება..." : "გრაფიკის შენახვა"}
      </button>
      {result && (
        <p className={result.ok ? styles.success : styles.error} role={result.ok ? "status" : "alert"}>
          {result.message}
        </p>
      )}
    </form>
  );
}
