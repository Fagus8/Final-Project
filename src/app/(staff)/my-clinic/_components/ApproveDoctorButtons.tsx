"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import list from "@/components/appointments/AppointmentList.module.scss";

export default function ApproveDoctorButtons({ doctorId }: { doctorId: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // POST = დადასტურება, DELETE = უარყოფა
  async function answer(method: "POST" | "DELETE") {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/doctors/${doctorId}/approve`, { method });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "მოქმედება ვერ შესრულდა");
        return;
      }

      router.refresh();
    } catch {
      setError("სერვერთან დაკავშირება ვერ მოხერხდა");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={list.actions}>
      <div className={list.formButtons}>
        <button type="button" className={list.primaryButton} disabled={isSaving} onClick={() => answer("POST")}>
          დადასტურება
        </button>
        <button type="button" className={list.cancelButton} disabled={isSaving} onClick={() => answer("DELETE")}>
          უარყოფა
        </button>
      </div>
      {error && <p className={list.error} role="alert">{error}</p>}
    </div>
  );
}
