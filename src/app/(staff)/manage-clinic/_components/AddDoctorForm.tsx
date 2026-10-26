"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import formStyles from "@/components/ui/InlineForm.module.scss";
import { sendRequest } from "@/lib/api-client";

// კლინიკა „კლინიკის მართვიდან“ ამატებს ახალ ექიმს.
// ელფოსტა სავალდებულოა: ამ ელფოსტით დარეგისტრირებული ექიმი ამ ჩანაწერს მიებმება
export default function AddDoctorForm({ clinicId }: { clinicId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const result = await sendRequest(`/api/clinics/${clinicId}/doctors`, "POST", {
      name,
      specialty,
      experienceYears,
      email,
    });

    setIsSaving(false);
    setMessage(result.message);
    // წარმატების შემდეგ ფორმას ვასუფთავებთ და ექიმი სიაში გამოჩნდება
    if (result.ok) {
      setName("");
      setSpecialty("");
      setExperienceYears(0);
      setEmail("");
      router.refresh();
    }
  }

  return (
    <form className={formStyles.form} onSubmit={add}>
      <label>
        სახელი და გვარი
        <input required value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        სპეციალობა
        <input required value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
      </label>
      <label>
        გამოცდილება (წელი)
        <input
          type="number"
          min="0"
          step="1"
          required
          value={experienceYears}
          onChange={(e) => setExperienceYears(Number(e.target.value))}
        />
      </label>
      <label>
        ექიმის ელფოსტა
        <input
          type="email"
          required
          value={email}
          placeholder="რეგისტრაციისთვის"
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <button type="submit" disabled={isSaving}>
        {isSaving ? "ემატება..." : "ექიმის დამატება"}
      </button>
      {message && <p className={formStyles.message}>{message}</p>}
    </form>
  );
}
