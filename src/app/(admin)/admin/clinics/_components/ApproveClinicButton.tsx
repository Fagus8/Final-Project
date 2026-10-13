"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../AdminClinics.module.scss";

export default function ApproveClinicButton({ clinicId }: { clinicId: string }) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState("");

  async function approveClinic() {
    setIsApproving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/clinics/${encodeURIComponent(clinicId)}/approve`,
        { method: "POST" },
      );
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "დამტკიცება ვერ მოხერხდა");
        return;
      }

      router.refresh();
    } catch {
      setError("სერვერთან დაკავშირება ვერ მოხერხდა");
    } finally {
      setIsApproving(false);
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
