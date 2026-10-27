"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import list from "@/components/ui/List.module.scss";
import { sendRequest } from "@/lib/api-client";

// კლინიკის ღილაკები ახალი ექიმის მოთხოვნაზე: დადასტურება ან უარყოფა (დადასტურებით)
export default function ApproveDoctorButtons({ doctorId, doctorName }: { doctorId: string; doctorName: string }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  // POST = დადასტურება, DELETE = უარყოფა
  async function answer(method: "POST" | "DELETE") {
    setIsSaving(true);
    setError("");

    const { ok, message } = await sendRequest(`/api/doctors/${doctorId}/approve`, method);

    setIsSaving(false);
    if (ok) {
      setIsConfirming(false);
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
        <button
          type="button"
          className={list.cancelButton}
          disabled={isSaving}
          onClick={() => {
            setError("");
            setIsConfirming(true);
          }}
        >
          უარყოფა
        </button>
      </div>
      {!isConfirming && error && <p className={list.error} role="alert">{error}</p>}

      <ConfirmDialog
        open={isConfirming}
        title="მოთხოვნის უარყოფა"
        message={<>უარვყოთ ექიმის <strong>{doctorName}</strong> მოთხოვნა? ექიმი ნახავს, რომ მოთხოვნა უარყავით, და სხვა კლინიკას აირჩევს.</>}
        confirmLabel="დიახ, უარყოფა"
        isBusy={isSaving}
        error={isConfirming ? error : ""}
        onConfirm={() => answer("DELETE")}
        onClose={() => !isSaving && setIsConfirming(false)}
      />
    </div>
  );
}
