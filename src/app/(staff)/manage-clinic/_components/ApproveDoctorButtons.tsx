"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import list from "@/components/ui/List.module.scss";
import { sendRequest } from "@/lib/api-client";

// კლინიკის ღილაკები ახალი ექიმის მოთხოვნაზე: დადასტურება ან უარყოფა
export default function ApproveDoctorButtons({ doctorId }: { doctorId: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // POST = დადასტურება, DELETE = უარყოფა
  async function answer(method: "POST" | "DELETE") {
    setIsSaving(true);
    setError("");

    const { ok, message } = await sendRequest(`/api/doctors/${doctorId}/approve`, method);

    setIsSaving(false);
    if (ok) {
      router.refresh();
    } else {
      setError(message);
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
