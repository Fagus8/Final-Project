"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import formStyles from "@/components/ui/InlineForm.module.scss";
import { sendRequest } from "@/lib/api-client";

type JoinClinicFormProps = {
  clinics: { id: string; name: string; city: string }[];
  // რეგისტრაციისას შეყვანილი მონაცემები, რომ ექიმმა ხელახლა არ აკრიფოს.
  // არ არის — სპეციალობას და გამოცდილებას აღარ ვკითხულობთ (ექიმი უკვე დადასტურებულია)
  defaults?: { specialty: string; experienceYears: number };
};

// ექიმი აქედან აგზავნის მოთხოვნას ერთ ან რამდენიმე კლინიკასთან
export default function JoinClinicForm({ clinics, defaults }: JoinClinicFormProps) {
  const router = useRouter();
  const [specialty, setSpecialty] = useState(defaults?.specialty ?? "");
  const [experienceYears, setExperienceYears] = useState(defaults?.experienceYears ?? 0);
  const [clinicIds, setClinicIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  function toggleClinic(id: string) {
    setClinicIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  // მოთხოვნა იქმნება როგორც დაუდასტურებელი კავშირი; კლინიკა მას „ახალი ექიმების“ სიაში ნახავს
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (clinicIds.length === 0) {
      setResult({ ok: false, message: "აირჩიე ერთი კლინიკა მაინც" });
      return;
    }

    setIsSaving(true);
    setResult(null);

    const saved = await sendRequest("/api/doctor-registration", "POST", {
      ...(defaults && { specialty, experienceYears }),
      clinicIds,
    });

    setIsSaving(false);
    setResult(saved);
    // გვერდი თავიდან იტვირთება და „მოთხოვნა გაგზავნილია“ გამოჩნდება
    if (saved.ok) {
      router.refresh();
    }
  }

  // დამტკიცებული კლინიკა ჯერ არ არის — ფორმას აზრი არ აქვს
  if (clinics.length === 0) {
    return (
      <p className={formStyles.hint}>
        დამტკიცებული კლინიკა ჯერ არ არის. როგორც კი ადმინისტრატორი კლინიკას დაამტკიცებს, აქ
        შეძლებ მის არჩევას.
      </p>
    );
  }

  return (
    <form className={formStyles.form} onSubmit={send}>
      {defaults && (
        <>
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
        </>
      )}
      <fieldset className={formStyles.checks}>
        <legend>კლინიკები</legend>
        {clinics.map((clinic) => (
          <label key={clinic.id}>
            <input
              type="checkbox"
              checked={clinicIds.includes(clinic.id)}
              onChange={() => toggleClinic(clinic.id)}
            />
            {clinic.name} ({clinic.city})
          </label>
        ))}
      </fieldset>
      <button type="submit" disabled={isSaving}>
        {isSaving ? "იგზავნება..." : "მოთხოვნის გაგზავნა"}
      </button>
      {result && (
        <p className={result.ok ? formStyles.success : formStyles.error} role={result.ok ? "status" : "alert"}>
          {result.message}
        </p>
      )}
    </form>
  );
}
