"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendRequest } from "@/lib/api-client";
import styles from "../AdminClinics.module.scss";

// ადმინის ღილაკი: კლინიკის დამტკიცება. დამტკიცების შემდეგ კლინიკა
// საიტზე ჩნდება და ექიმებს შეუძლიათ მისი არჩევა
export default function ApproveClinicButton({ clinicId }: { clinicId: string }) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState("");

  async function approveClinic() {
    setIsApproving(true);
    setError("");

    const { ok, message } = await sendRequest(`/api/admin/clinics/${clinicId}/approve`, "POST");

    setIsApproving(false);
    if (ok) {
      // გვერდს თავიდან ვტვირთავთ, რომ სტატუსი „დამტკიცებულია“ გამოჩნდეს
      router.refresh();
    } else {
      setError(message);
    }
  }

  return (
    <div className={styles.approval}>
      <button
        className={styles.approveButton}
        type="button"
        disabled={isApproving}
        onClick={approveClinic}
      >
        {isApproving ? "მტკიცდება..." : "კლინიკის დამტკიცება"}
      </button>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
