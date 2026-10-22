"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendRequest } from "@/lib/request";
import styles from "../AdminClinics.module.scss";

// ადმინის ფორმა: კლინიკის მონაცემების და მისი ექიმების რედაქტირება

type DoctorDraft = {
  // ბაზის id; ახლად დამატებულ ექიმს ჯერ არ აქვს
  id?: string;
  // React-ის key სიისთვის: ძველ ექიმს id-ის ტოლია, ახალს — შემთხვევითი
  localKey: string;
  name: string;
  specialty: string;
  experienceYears: number;
};

type ClinicData = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  specialty: string;
  imageUrl: string | null;
  doctors: { id: string; name: string; specialty: string; experienceYears: number }[];
};

// კლინიკის ველები ფორმაში ერთნაირად იხატება, ამიტომ სიიდან ვაგენერირებთ
const clinicFields = [
  { name: "name", label: "კლინიკის სახელი" },
  { name: "city", label: "ქალაქი" },
  { name: "address", label: "მისამართი" },
  { name: "phone", label: "ტელეფონი" },
  { name: "specialty", label: "სპეციალიზაცია" },
  { name: "imageUrl", label: "სურათის ბმული" },
] as const;

// ბაზის მონაცემებიდან ფორმის საწყისი მდგომარეობა
function makeDraft(clinic: ClinicData) {
  return {
    ...clinic,
    imageUrl: clinic.imageUrl ?? "",
    doctors: clinic.doctors.map((doctor): DoctorDraft => ({ ...doctor, localKey: doctor.id })),
  };
}

export default function EditClinicForm({ clinic }: { clinic: ClinicData }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  // რედაქტირებადი ასლი; შენახვამდე ბაზაში არაფერი იცვლება
  const [draft, setDraft] = useState(() => makeDraft(clinic));

  // ერთი ექიმის ერთი ან რამდენიმე ველის შეცვლა
  function updateDoctor(index: number, changes: Partial<DoctorDraft>) {
    setDraft((current) => ({
      ...current,
      doctors: current.doctors.map((doctor, i) => (i === index ? { ...doctor, ...changes } : doctor)),
    }));
  }

  function removeDoctor(localKey: string) {
    setDraft((current) => ({
      ...current,
      doctors: current.doctors.filter((doctor) => doctor.localKey !== localKey),
    }));
  }

  // ახალ ექიმს დროებითი localKey ეძლევა, id-ს ბაზა შენახვისას მიანიჭებს
  function addDoctor() {
    setDraft((current) => ({
      ...current,
      doctors: [
        ...current.doctors,
        { localKey: crypto.randomUUID(), name: "", specialty: "", experienceYears: 0 },
      ],
    }));
  }

  // გაუქმება: ცვლილებებს ვყრით და საწყის მონაცემებს ვაბრუნებთ
  function cancelEditing() {
    setDraft(makeDraft(clinic));
    setError("");
    setIsEditing(false);
  }

  // შენახვა: მთელ კლინიკას ექიმებიანად ვაგზავნით. ექიმი id-ით განახლდება,
  // id-ის გარეშე შეიქმნება, სიიდან ამოღებული კი წაიშლება
  async function saveClinic(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    const { ok, message } = await sendRequest(`/api/admin/clinics/${clinic.id}`, "PATCH", {
      name: draft.name,
      city: draft.city,
      address: draft.address,
      phone: draft.phone,
      specialty: draft.specialty,
      imageUrl: draft.imageUrl,
      // localKey სერვერს არ სჭირდება. ახალ ექიმს id არ აქვს (undefined JSON-ში არ იგზავნება)
      doctors: draft.doctors.map(({ id, name, specialty, experienceYears }) => ({
        id,
        name,
        specialty,
        experienceYears,
      })),
    });

    setIsSaving(false);
    if (!ok) {
      setError(message);
      return;
    }

    setIsEditing(false);
    router.refresh();
  }

  // სანამ რედაქტირება არ დაიწყება, მხოლოდ ღილაკი ჩანს
  if (!isEditing) {
    return (
      <button className={styles.editButton} type="button" onClick={() => setIsEditing(true)}>
        რედაქტირება
      </button>
    );
  }

  return (
    <form className={styles.editForm} onSubmit={saveClinic}>
      <h3>კლინიკის მონაცემების რედაქტირება</h3>
      {clinicFields.map((field) => (
        <label className={styles.field} key={field.name}>
          {field.label}
          <input
            required={field.name !== "imageUrl"}
            type={field.name === "imageUrl" ? "url" : "text"}
            value={draft[field.name]}
            onChange={(event) => {
              const value = event.target.value;
              setDraft((current) => ({ ...current, [field.name]: value }));
            }}
          />
        </label>
      ))}

      <h3>ექიმების რედაქტირება</h3>
      {draft.doctors.map((doctor, index) => (
        <fieldset className={styles.doctorEditor} key={doctor.localKey}>
          <legend>{doctor.name || `ექიმი ${index + 1}`}</legend>
          <button
            className={styles.removeDoctorButton}
            type="button"
            disabled={isSaving}
            onClick={() => removeDoctor(doctor.localKey)}
          >
            ექიმის წაშლა
          </button>
          <label className={styles.field}>
            სახელი და გვარი
            <input
              required
              value={doctor.name}
              onChange={(event) => updateDoctor(index, { name: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            სპეციალიზაცია
            <input
              required
              value={doctor.specialty}
              onChange={(event) => updateDoctor(index, { specialty: event.target.value })}
            />
          </label>
          <label className={styles.field}>
            გამოცდილება (წელი)
            <input
              required
              type="number"
              min="0"
              step="1"
              value={doctor.experienceYears}
              onChange={(event) => updateDoctor(index, { experienceYears: Number(event.target.value) })}
            />
          </label>
        </fieldset>
      ))}
      <button className={styles.addDoctorButton} type="button" onClick={addDoctor}>
        ექიმის დამატება
      </button>

      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.formActions}>
        <button className={styles.editButton} type="submit" disabled={isSaving}>
          {isSaving ? "ინახება..." : "შენახვა"}
        </button>
        <button className={styles.cancelButton} type="button" disabled={isSaving} onClick={cancelEditing}>
          გაუქმება
        </button>
      </div>
    </form>
  );
}
