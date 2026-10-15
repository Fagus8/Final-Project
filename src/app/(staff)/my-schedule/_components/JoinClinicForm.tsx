"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import formStyles from "@/components/doctors/DoctorScheduleForm.module.scss";

type JoinClinicFormProps = {
  clinics: { id: string; name: string; city: string }[];
};

// ექიმი, რომელიც ჯერ არცერთ კლინიკას არ უკავშირდება, აქედან აგზავნის მოთხოვნას
export default function JoinClinicForm({ clinics }: JoinClinicFormProps) {
  const router = useRouter();
  const [specialty, setSpecialty] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [clinicId, setClinicId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  // მოთხოვნა იქმნება როგორც დაუდასტურებელი ექიმი; კლინიკა მას „ახალი ექიმების“ სიაში ნახავს
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/doctor-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialty, experienceYears, clinicId }),
      });
      const result = await response.json();

      setMessage(result.message);
      // გვერდი თავიდან იტვირთება და „მოთხოვნა გაგზავნილია“ გამოჩნდება
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
    <form className={formStyles.form} onSubmit={send}>
      <label>
        სპეციალობა
        <input required value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
      </label>
      <label>
        გამოცდილება (წელი)
        <input
          type="number"
          min="0"
          required
          value={experienceYears}
          onChange={(e) => setExperienceYears(Number(e.target.value))}
        />
      </label>
      <label>
        კლინიკა
        <select required value={clinicId} onChange={(e) => setClinicId(e.target.value)}>
          <option value="">აირჩიე კლინიკა</option>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name} ({clinic.city})
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={isSaving}>
        {isSaving ? "იგზავნება..." : "მოთხოვნის გაგზავნა"}
      </button>
      {message && <p className={formStyles.message}>{message}</p>}
    </form>
  );
}
