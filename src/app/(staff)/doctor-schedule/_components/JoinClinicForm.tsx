"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import formStyles from "@/components/ui/InlineForm.module.scss";
import { sendRequest } from "@/lib/api-client";

type JoinClinicFormProps = {
  clinics: { id: string; name: string; city: string }[];
  // რეგისტრაციისას შეყვანილი მონაცემები, რომ ექიმმა ხელახლა არ აკრიფოს
  defaults?: { specialty: string; experienceYears: number };
};

// ექიმი, რომელიც ჯერ არცერთ კლინიკას არ უკავშირდება, აქედან აგზავნის მოთხოვნას
export default function JoinClinicForm({ clinics, defaults }: JoinClinicFormProps) {
  const router = useRouter();
  const [specialty, setSpecialty] = useState(defaults?.specialty ?? "");
  const [experienceYears, setExperienceYears] = useState(defaults?.experienceYears ?? 0);
  const [clinicId, setClinicId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  // მოთხოვნა იქმნება როგორც დაუდასტურებელი ექიმი; კლინიკა მას „ახალი ექიმების“ სიაში ნახავს
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const result = await sendRequest("/api/doctor-registration", "POST", {
      specialty,
      experienceYears,
      clinicId,
    });

    setIsSaving(false);
    setMessage(result.message);
    // გვერდი თავიდან იტვირთება და „მოთხოვნა გაგზავნილია“ გამოჩნდება
    if (result.ok) {
      router.refresh();
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
