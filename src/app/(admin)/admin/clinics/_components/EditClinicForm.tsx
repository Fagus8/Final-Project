"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../AdminClinics.module.scss";

// ადმინის ფორმა: კლინიკის მონაცემების და მისი ექიმების რედაქტირება

// ფორმის მონაცემები. localKey სიაში ექიმის გასარჩევადაა
// (ახლად დამატებულ ექიმს id ჯერ არ აქვს)
type ClinicDraft = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  specialty: string;
  imageUrl: string | null;
  doctors: {
    id?: string;
    localKey?: string;
    name: string;
    specialty: string;
    experienceYears: number;
  }[];
};

// კლინიკის ველები ფორმაში ერთნაირად იხატება, ამიტომ სიიდან ვაგენერირებთ
const clinicFields: { name: keyof Omit<ClinicDraft, "id" | "doctors">; label: string }[] = [
  { name: "name", label: "კლინიკის სახელი" },
  { name: "city", label: "ქალაქი" },
  { name: "address", label: "მისამართი" },
  { name: "phone", label: "ტელეფონი" },
  { name: "specialty", label: "სპეციალიზაცია" },
  { name: "imageUrl", label: "სურათის ბმული" },
];

export default function EditClinicForm({ clinic }: { clinic: ClinicDraft }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  // რედაქტირებადი ასლი; შენახვამდე ბაზაში არაფერი იცვლება
  const [draft, setDraft] = useState(() => ({
    ...clinic,
    doctors: clinic.doctors.map((doctor) => ({
      ...doctor,
      localKey: doctor.id,
    })),
  }));

  // გაუქმება: ცვლილებებს ვყრით და საწყის მონაცემებს ვაბრუნებთ
  function cancelEditing() {
    setDraft({
      ...clinic,
      doctors: clinic.doctors.map((doctor) => ({
        ...doctor,
        localKey: doctor.id,
      })),
    });
    setError("");
    setIsEditing(false);
  }

  // შენახვა: მთელ კლინიკას ექიმებიანად ვაგზავნით. ექიმი id-ით განახლდება,
  // id-ის გარეშე შეიქმნება, სიიდან ამოღებული კი წაიშლება
  async function saveClinic(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/clinics/${encodeURIComponent(clinic.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: draft.name,
            city: draft.city,
            address: draft.address,
            phone: draft.phone,
            specialty: draft.specialty,
            imageUrl: draft.imageUrl ?? "",
            doctors: draft.doctors.map((doctor) => ({
              ...(doctor.id ? { id: doctor.id } : {}),
              name: doctor.name,
              specialty: doctor.specialty,
              experienceYears: doctor.experienceYears,
            })),
          }),
        },
      );
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "ცვლილებების შენახვა ვერ მოხერხდა");
        return;
      }

      setIsEditing(false);
      router.refresh();
    } catch {
      setError("სერვერთან დაკავშირება ვერ მოხერხდა");
    } finally {
      setIsSaving(false);
    }
  }

  // სანამ რედაქტირება არ დაიწყება, მხოლოდ ღილაკი ჩანს
  if (!isEditing) {
    return (
      <button
        className={styles.editButton}
        type="button"
        onClick={() => setIsEditing(true)}
      >
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
            value={draft[field.name] ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              setDraft((current) => ({ ...current, [field.name]: value }));
            }}
          />
        </label>
      ))}

      <h3>ექიმების რედაქტირება</h3>
      {/* თითოეული ველის ცვლილება მხოლოდ შესაბამის ექიმს ცვლის (index-ით) */}
      {draft.doctors.map((doctor, index) => (
        <fieldset className={styles.doctorEditor} key={doctor.localKey}>
          <legend>{doctor.name || `ექიმი ${index + 1}`}</legend>
          <button
            className={styles.removeDoctorButton}
            type="button"
            disabled={isSaving}
            onClick={() => {
              setDraft((current) => ({
                ...current,
                doctors: current.doctors.filter(
                  (item) => item.localKey !== doctor.localKey,
                ),
              }));
            }}
          >
            ექიმის წაშლა
          </button>
          <label className={styles.field}>
            სახელი და გვარი
            <input
              required
              value={doctor.name}
              onChange={(event) => {
                const name = event.target.value;
                setDraft((current) => ({
                  ...current,
                  doctors: current.doctors.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, name } : item,
                  ),
                }));
              }}
            />
          </label>
          <label className={styles.field}>
            სპეციალიზაცია
            <input
              required
              value={doctor.specialty}
              onChange={(event) => {
                const specialty = event.target.value;
                setDraft((current) => ({
                  ...current,
                  doctors: current.doctors.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, specialty } : item,
                  ),
                }));
              }}
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
              onChange={(event) => {
                const experienceYears = Number(event.target.value);
                setDraft((current) => ({
                  ...current,
                  doctors: current.doctors.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, experienceYears } : item,
                  ),
                }));
              }}
            />
          </label>
        </fieldset>
      ))}
      {/* ახალ ექიმს დროებითი localKey ეძლევა, id-ს ბაზა შენახვისას მიანიჭებს */}
      <button
        className={styles.addDoctorButton}
        type="button"
        onClick={() => {
          setDraft((current) => ({
            ...current,
            doctors: [
              ...current.doctors,
              {
                localKey: crypto.randomUUID(),
                name: "",
                specialty: "",
                experienceYears: 0,
              },
            ],
          }));
        }}
      >
        ექიმის დამატება
      </button>

      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.formActions}>
        <button className={styles.editButton} type="submit" disabled={isSaving}>
          {isSaving ? "ინახება..." : "შენახვა"}
        </button>
        <button
          className={styles.cancelButton}
          type="button"
          disabled={isSaving}
          onClick={cancelEditing}
        >
          გაუქმება
        </button>
      </div>
    </form>
  );
}
