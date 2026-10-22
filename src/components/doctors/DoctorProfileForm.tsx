"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
import { sendRequest } from "@/lib/request";
import styles from "./DoctorProfileForm.module.scss";

// ექიმის პროფილის ფორმა: ფოტო, სპეციალობა, გამოცდილება, ფასი, ბიოგრაფია,
// განათლება, ენები და სერვისები. იყენებს თავად ექიმი და მისი კლინიკა.
// შენახული მონაცემები ექიმის საჯარო გვერდზე (/doctors/[id]) ჩანს

// ენები, რომლებიც ფორმაში მოსანიშნად ჩანს
const LANGUAGE_OPTIONS = [
  "ქართული",
  "ინგლისური",
  "რუსული",
  "გერმანული",
  "თურქული",
  "ფრანგული",
  "სომხური",
  "აზერბაიჯანული",
];

// ფოტოს ზომა პიქსელებში (კვადრატი)
const PHOTO_SIZE = 400;

type DoctorProfileFormProps = {
  doctor: {
    id: string;
    name: string;
    specialty: string;
    experienceYears: number;
    avatarUrl: string | null;
    bio: string | null;
    education: string | null;
    languages: string[];
    services: string[];
    consultationFee: number | null;
  };
};

// სურათს ვჭრით კვადრატად და ვაპატარავებთ, რომ ბაზაში ცოტა ადგილი დაიკავოს
function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      // სურათის შუიდან ვიღებთ ყველაზე დიდ კვადრატს და 400x400-ზე ვხატავთ
      const side = Math.min(image.width, image.height);
      const canvas = document.createElement("canvas");
      canvas.width = PHOTO_SIZE;
      canvas.height = PHOTO_SIZE;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("canvas"));
        return;
      }

      context.drawImage(
        image,
        (image.width - side) / 2,
        (image.height - side) / 2,
        side,
        side,
        0,
        0,
        PHOTO_SIZE,
        PHOTO_SIZE,
      );
      // დროებით ბმულს ვათავისუფლებთ; შედეგი JPEG ტექსტად (data URL) ინახება
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image"));
    };

    image.src = url;
  });
}

export default function DoctorProfileForm({ doctor }: DoctorProfileFormProps) {
  const router = useRouter();
  const [avatarUrl, setAvatarUrl] = useState(doctor.avatarUrl ?? "");
  const [specialty, setSpecialty] = useState(doctor.specialty);
  // რიცხვითი ველები ტექსტად ინახება, რომ ცარიელი ველიც შეიძლებოდეს
  const [experienceYears, setExperienceYears] = useState(String(doctor.experienceYears));
  const [consultationFee, setConsultationFee] = useState(
    doctor.consultationFee === null ? "" : String(doctor.consultationFee),
  );
  const [bio, setBio] = useState(doctor.bio ?? "");
  const [education, setEducation] = useState(doctor.education ?? "");
  const [languages, setLanguages] = useState(doctor.languages);
  // სერვისები ფორმაში ერთ ტექსტად, თითო ხაზზე თითო სერვისი
  const [services, setServices] = useState(doctor.services.join("\n"));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  // უნიკალური id ველებისთვის: კლინიკის გვერდზე ეს ფორმა რამდენჯერმე ჩანს
  const id = (field: string) => `doctor-${doctor.id}-${field}`;

  // ფოტოს არჩევა: ფაილს ვამოწმებთ, ვაპატარავებთ და გადახედვისთვის ვაჩვენებთ
  async function choosePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // ველს ვასუფთავებთ, რომ იგივე ფაილის ხელახლა არჩევაც იმუშაოს
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("აირჩიე სურათის ფაილი");
      return;
    }

    try {
      setAvatarUrl(await resizePhoto(file));
      setMessage("");
    } catch {
      setMessage("სურათის წაკითხვა ვერ მოხერხდა");
    }
  }

  // ენის მონიშვნა/მოხსნა
  function toggleLanguage(language: string) {
    setLanguages((current) =>
      current.includes(language)
        ? current.filter((item) => item !== language)
        : [...current, language],
    );
  }

  // შენახვა: ტექსტურ ველებს სწორ ტიპებად ვაქცევთ (რიცხვი, null, სია)
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const result = await sendRequest(`/api/doctors/${doctor.id}/profile`, "PATCH", {
      avatarUrl,
      specialty,
      experienceYears: Number(experienceYears) || 0,
      consultationFee: consultationFee === "" ? null : Number(consultationFee),
      bio,
      education,
      languages,
      services: services.split("\n"),
    });

    setIsSaving(false);
    setMessage(result.message);
    if (result.ok) {
      router.refresh();
    }
  }

  return (
    <form className={styles.form} onSubmit={save}>
      <div className={styles.photoRow}>
        <DoctorAvatar name={doctor.name} avatarUrl={avatarUrl || null} className={styles.photo} alt={doctor.name} />

        <div className={styles.photoActions}>
          <label className={styles.uploadButton}>
            ფოტოს ატვირთვა
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} hidden />
          </label>
          {avatarUrl && (
            <button type="button" className={styles.removeButton} onClick={() => setAvatarUrl("")}>
              წაშლა
            </button>
          )}
          <small>JPG, PNG ან WEBP — ავტომატურად დაპატარავდება</small>
        </div>
      </div>

      <div className={styles.grid}>
        <label htmlFor={id("specialty")}>
          სპეციალობა
          <input
            id={id("specialty")}
            type="text"
            required
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </label>
        <label htmlFor={id("experience")}>
          გამოცდილება — წელი
          <input
            id={id("experience")}
            type="number"
            min="0"
            max="80"
            step="1"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
          />
        </label>
        <label htmlFor={id("fee")}>
          კონსულტაციის ფასი — ₾
          <input
            id={id("fee")}
            type="number"
            min="0"
            step="1"
            placeholder="მაგ: 50"
            value={consultationFee}
            onChange={(e) => setConsultationFee(e.target.value)}
          />
        </label>
      </div>

      <label htmlFor={id("bio")}>
        ჩემ შესახებ
        <textarea
          id={id("bio")}
          rows={4}
          maxLength={1500}
          placeholder="მოკლედ მოყევი შენს შესახებ და რას მკურნალობ"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </label>

      <label htmlFor={id("education")}>
        განათლება
        <textarea
          id={id("education")}
          rows={2}
          maxLength={500}
          placeholder="მაგ: თბილისის სახელმწიფო სამედიცინო უნივერსიტეტი"
          value={education}
          onChange={(e) => setEducation(e.target.value)}
        />
      </label>

      <label htmlFor={id("services")}>
        სერვისები (თითო ხაზზე თითო)
        <textarea
          id={id("services")}
          rows={4}
          placeholder={"მაგ:\nკონსულტაცია\nექოკარდიოგრაფია"}
          value={services}
          onChange={(e) => setServices(e.target.value)}
        />
      </label>

      <fieldset className={styles.languages}>
        <legend>ენები</legend>
        {LANGUAGE_OPTIONS.map((language) => (
          <label key={language}>
            <input
              type="checkbox"
              checked={languages.includes(language)}
              onChange={() => toggleLanguage(language)}
            />
            {language}
          </label>
        ))}
      </fieldset>

      <div className={styles.footer}>
        <button type="submit" disabled={isSaving}>
          {isSaving ? "ინახება..." : "პროფილის შენახვა"}
        </button>
        {message && <p className={styles.message}>{message}</p>}
      </div>
    </form>
  );
}
