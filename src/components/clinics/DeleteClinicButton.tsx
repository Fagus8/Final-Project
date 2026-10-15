"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./DeleteClinicButton.module.scss";

type DeleteClinicButtonProps = {
  clinicId: string;
  clinicName: string;
  // კლინიკა საკუთარ თავს შლის — წაშლის შემდეგ მთავარ გვერდზე გადავდივართ
  isOwnClinic?: boolean;
};

// შემთხვევით რომ არ წაიშალოს, დასადასტურებლად კლინიკის სახელი უნდა ჩაიწეროს
export default function DeleteClinicButton({
  clinicId,
  clinicName,
  isOwnClinic = false,
}: DeleteClinicButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [typedName, setTypedName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const nameMatches = typedName.trim() === clinicName.trim();

  function cancel() {
    setIsConfirming(false);
    setTypedName("");
    setError("");
  }

  async function deleteClinic() {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/clinics/${encodeURIComponent(clinicId)}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "წაშლა ვერ მოხერხდა");
        return;
      }

      if (isOwnClinic) {
        router.replace("/");
      }
      router.refresh();
    } catch {
      setError("სერვერთან დაკავშირება ვერ მოხერხდა");
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isConfirming) {
    return (
      <button type="button" className={styles.deleteButton} onClick={() => setIsConfirming(true)}>
        კლინიკის წაშლა
      </button>
    );
  }

  return (
    <div className={styles.confirm} role="group" aria-label="კლინიკის წაშლის დადასტურება">
      <p>
        წაიშლება {isOwnClinic ? "შენი ანგარიში, " : "კლინიკის ანგარიში, "}ყველა ექიმი და ვიზიტი.
        ამ მოქმედების გაუქმება შეუძლებელია.
      </p>
      <label>
        დასადასტურებლად ჩაწერე: <strong>{clinicName}</strong>
        <input
          type="text"
          value={typedName}
          autoComplete="off"
          onChange={(e) => setTypedName(e.target.value)}
        />
      </label>
      <div className={styles.buttons}>
        <button
          type="button"
          className={styles.deleteButton}
          disabled={!nameMatches || isDeleting}
          onClick={deleteClinic}
        >
          {isDeleting ? "იშლება..." : "საბოლოოდ წაშლა"}
        </button>
        <button type="button" className={styles.cancelButton} onClick={cancel} disabled={isDeleting}>
          გაუქმება
        </button>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
