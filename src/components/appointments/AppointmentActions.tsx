"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./AppointmentList.module.scss";

type AppointmentActionsProps = {
  appointmentId: string;
  // ღილაკები ჩანს მხოლოდ მაშინ, როცა მშობელი გვერდი ამის უფლებას იძლევა.
  // საბოლოო შემოწმებას მაინც სერვერი აკეთებს
  canCancel?: boolean;
  canComplete?: boolean;
  diagnosis?: string | null;
  prescription?: string | null;
};

// ვიზიტის ღილაკები: გაუქმება (პაციენტი, ექიმი, კლინიკა) და
// დიაგნოზის ჩაწერა/შეცვლა (ექიმი). გამოიყენება რამდენიმე გვერდზე
export default function AppointmentActions({
  appointmentId,
  canCancel = false,
  canComplete = false,
  diagnosis,
  prescription,
}: AppointmentActionsProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  // ფორმა არსებული დიაგნოზით ივსება, რომ ექიმმა შეცვლა შეძლოს
  const [diagnosisText, setDiagnosisText] = useState(diagnosis ?? "");
  const [prescriptionText, setPrescriptionText] = useState(prescription ?? "");

  // ყველა მოქმედება ერთ API-ზე იგზავნება
  async function sendAction(body: object) {
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.message || "მოქმედება ვერ შესრულდა");
        return;
      }

      // წარმატებისას ფორმას ვხურავთ და გვერდს ვაახლებთ (ახალი სტატუსი გამოჩნდება)
      setShowForm(false);
      router.refresh();
    } catch {
      setError("სერვერთან დაკავშირება ვერ მოხერხდა");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={styles.actions}>
      {canCancel && (
        <button
          type="button"
          className={styles.cancelButton}
          disabled={isSaving}
          onClick={() => {
            // შემთხვევითი დაჭერისგან დაცვა
            if (confirm("ნამდვილად გსურს ვიზიტის გაუქმება?")) {
              sendAction({ action: "cancel" });
            }
          }}
        >
          გაუქმება
        </button>
      )}

      {canComplete && !showForm && (
        <button type="button" className={styles.primaryButton} onClick={() => setShowForm(true)}>
          {diagnosis ? "დიაგნოზის შეცვლა" : "დიაგნოზის ჩაწერა"}
        </button>
      )}

      {/* დიაგნოზის ფორმა: შენახვისას ვიზიტი „დასრულებული“ ხდება */}
      {canComplete && showForm && (
        <form
          className={styles.diagnosisForm}
          onSubmit={(event) => {
            event.preventDefault();
            sendAction({
              action: "complete",
              diagnosis: diagnosisText,
              prescription: prescriptionText,
            });
          }}
        >
          <label>
            დიაგნოზი
            <textarea
              required
              rows={2}
              value={diagnosisText}
              onChange={(event) => setDiagnosisText(event.target.value)}
            />
          </label>
          <label>
            დანიშნულება / რეცეპტი
            <textarea
              rows={3}
              value={prescriptionText}
              onChange={(event) => setPrescriptionText(event.target.value)}
            />
          </label>
          <div className={styles.formButtons}>
            <button type="submit" className={styles.primaryButton} disabled={isSaving}>
              {isSaving ? "ინახება..." : "შენახვა"}
            </button>
            <button type="button" className={styles.cancelButton} onClick={() => setShowForm(false)}>
              დახურვა
            </button>
          </div>
        </form>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
