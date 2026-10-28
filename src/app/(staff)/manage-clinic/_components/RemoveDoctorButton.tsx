"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import list from "@/components/ui/List.module.scss";
import { sendRequest } from "@/lib/api-client";

// კლინიკა ხსნის ექიმს: ამ კლინიკაში მომავალი ვიზიტები უქმდება, ისტორია რჩება
export default function RemoveDoctorButton({
  doctorId,
  clinicId,
  doctorName,
  upcomingCount,
}: {
  doctorId: string;
  clinicId: string;
  doctorName: string;
  // რამდენი მომავალი ვიზიტი გაუქმდება — დადასტურების ტექსტისთვის
  upcomingCount: number;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setIsSaving(true);
    setError("");

    const { ok, message } = await sendRequest(`/api/doctors/${doctorId}/clinics/${clinicId}`, "DELETE");

    setIsSaving(false);
    if (!ok) {
      setError(message);
      return;
    }

    setIsOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className={list.cancelButton}
        onClick={() => {
          setError("");
          setIsOpen(true);
        }}
      >
        კლინიკიდან მოხსნა
      </button>

      <ConfirmDialog
        open={isOpen}
        title="ექიმის მოხსნა"
        message={
          <>
            მოვხსნათ <strong>{doctorName}</strong> კლინიკიდან?{" "}
            {upcomingCount > 0
              ? `მისი ${upcomingCount} მომავალი ვიზიტი გაუქმდება და პაციენტები გაუქმებას ნახავენ.`
              : "მომავალი ვიზიტები არ აქვს."}{" "}
            წარსული ვიზიტები და დიაგნოზები პაციენტების ისტორიაში დარჩება.
          </>
        }
        confirmLabel="დიახ, მოხსნა"
        isBusy={isSaving}
        error={error}
        onConfirm={remove}
        onClose={() => !isSaving && setIsOpen(false)}
      />
    </>
  );
}
