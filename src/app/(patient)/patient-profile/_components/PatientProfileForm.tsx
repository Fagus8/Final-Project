"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import formStyles from "@/components/ui/InlineForm.module.scss";
import { sendRequest } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { BLOOD_TYPES } from "@/lib/blood-types";

type PatientProfileFormProps = {
  name: string;
  phone: string;
  bloodType: string;
};

// პაციენტის მონაცემების შეცვლა: სახელი (ანგარიშში), ტელეფონი და სისხლის ჯგუფი
export default function PatientProfileForm(initial: PatientProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [bloodType, setBloodType] = useState(initial.bloodType);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setResult(null);

    // სახელი better-auth-ის ანგარიშშია, დანარჩენი — პაციენტის ჩანაწერში
    if (name.trim() !== initial.name) {
      const { error } = await authClient.updateUser({ name: name.trim() });
      if (error) {
        setIsSaving(false);
        setResult({ ok: false, message: error.message ?? "სახელის შეცვლა ვერ მოხერხდა" });
        return;
      }
    }

    const saved = await sendRequest("/api/patient-registration", "POST", { phone, bloodType });

    setIsSaving(false);
    setResult(saved);
    if (saved.ok) {
      router.refresh();
    }
  }

  return (
    <form className={formStyles.form} onSubmit={save}>
      <label>
        სახელი და გვარი
        <input required value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        ტელეფონი
        <input required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
      </label>
      <label>
        სისხლის ჯგუფი
        <select value={bloodType} onChange={(event) => setBloodType(event.target.value)}>
          <option value="">ჯერ არ ვიცი</option>
          {BLOOD_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={isSaving}>
        {isSaving ? "ინახება..." : "შენახვა"}
      </button>
      {result && (
        <p className={result.ok ? formStyles.success : formStyles.error} role={result.ok ? "status" : "alert"}>
          {result.message}
        </p>
      )}
    </form>
  );
}
