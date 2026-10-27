"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { sendRequest } from "@/lib/api-client";
import styles from "@/components/ui/List.module.scss";
import actionStyles from "./AppointmentActions.module.scss";

type AppointmentActionsProps = {
  appointmentId: string;
  // ღილაკები ჩანს მხოლოდ მაშინ, როცა მშობელი გვერდი ამის უფლებას იძლევა.
  // საბოლოო შემოწმებას მაინც სერვერი აკეთებს
  canCancel?: boolean;
  canComplete?: boolean;
  diagnosis?: string | null;
  prescription?: string | null;
};

// რომელი ფანჯარაა ღია: გაუქმების დადასტურება, დიაგნოზის ფორმა ან არცერთი
type OpenDialog = "cancel" | "diagnosis" | null;

// ვიზიტის ღილაკები: გაუქმება მიზეზით (პაციენტი, კლინიკა) და
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
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  // ფორმა არსებული დიაგნოზით ივსება, რომ ექიმმა შეცვლა შეძლოს
  const [diagnosisText, setDiagnosisText] = useState(diagnosis ?? "");
  const [prescriptionText, setPrescriptionText] = useState(prescription ?? "");
  const dialogRef = useRef<HTMLDialogElement>(null);

  // დიაგნოზის ფორმა მოდალურ ფანჯარაში იხსნება (<dialog>: Esc-ით იხურება, ფოკუსი შიგნით რჩება)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const showForm = openDialog === "diagnosis";
    if (showForm && !dialog.open) dialog.showModal();
    if (!showForm && dialog.open) dialog.close();
  }, [openDialog]);

  function openForm() {
    // ყოველ გახსნაზე ფორმა შენახული მნიშვნელობებით ივსება
    setDiagnosisText(diagnosis ?? "");
    setPrescriptionText(prescription ?? "");
    setError("");
    setOpenDialog("diagnosis");
  }

  function openCancel() {
    setError("");
    setOpenDialog("cancel");
  }

  function close() {
    if (!isSaving) setOpenDialog(null);
  }

  // ყველა მოქმედება ერთ API-ზე იგზავნება
  async function sendAction(body: object) {
    setIsSaving(true);
    setError("");

    const { ok, message } = await sendRequest(`/api/appointments/${appointmentId}`, "PATCH", body);

    setIsSaving(false);
    if (!ok) {
      setError(message);
      return;
    }

    // წარმატებისას ფანჯარას ვხურავთ და გვერდს ვაახლებთ (ახალი სტატუსი გამოჩნდება)
    setOpenDialog(null);
    router.refresh();
  }

  return (
    <div className={styles.actions}>
      {canCancel && (
        <button type="button" className={styles.cancelButton} disabled={isSaving} onClick={openCancel}>
          გაუქმება
        </button>
      )}

      {canComplete && (
        <button type="button" className={styles.primaryButton} onClick={openForm}>
          {diagnosis ? "დიაგნოზის შეცვლა" : "დიაგნოზის ჩაწერა"}
        </button>
      )}

      {canCancel && (
        <ConfirmDialog
          open={openDialog === "cancel"}
          title="ვიზიტის გაუქმება"
          message="ნამდვილად გსურს ვიზიტის გაუქმება? მეორე მხარე გაუქმებას და მიზეზს თავის გვერდზე ნახავს."
          confirmLabel="დიახ, გაუქმება"
          reasonLabel="მიზეზი (არასავალდებულო)"
          isBusy={isSaving}
          error={openDialog === "cancel" ? error : ""}
          onConfirm={(reason) => sendAction({ action: "cancel", reason })}
          onClose={close}
        />
      )}

      {/* დიაგნოზის ფორმა: შენახვისას ვიზიტი „დასრულებული“ ხდება */}
      {canComplete && (
        <dialog
          ref={dialogRef}
          className={actionStyles.dialog}
          aria-labelledby={`diagnosis-title-${appointmentId}`}
          onClose={close}
          // ფონზე (ფანჯრის გარეთ) დაჭერა ფანჯარას ხურავს
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <form
            className={actionStyles.diagnosisForm}
            onSubmit={(event) => {
              event.preventDefault();
              sendAction({
                action: "complete",
                diagnosis: diagnosisText,
                prescription: prescriptionText,
              });
            }}
          >
            <div className={actionStyles.dialogHeader}>
              <h2 id={`diagnosis-title-${appointmentId}`}>
                {diagnosis ? "დიაგნოზის შეცვლა" : "დიაგნოზის ჩაწერა"}
              </h2>
              <button
                type="button"
                className={actionStyles.closeButton}
                aria-label="დახურვა"
                onClick={close}
              >
                ×
              </button>
            </div>
            <label>
              დიაგნოზი
              <textarea
                required
                rows={3}
                value={diagnosisText}
                onChange={(event) => setDiagnosisText(event.target.value)}
              />
            </label>
            <label>
              დანიშნულება / რეცეპტი
              <textarea
                rows={9}
                value={prescriptionText}
                onChange={(event) => setPrescriptionText(event.target.value)}
              />
            </label>
            {openDialog === "diagnosis" && error && <p className={styles.error} role="alert">{error}</p>}
            <div className={actionStyles.dialogButtons}>
              <button type="button" className={styles.cancelButton} onClick={close}>
                დახურვა
              </button>
              <button type="submit" className={styles.primaryButton} disabled={isSaving}>
                {isSaving ? "ინახება..." : "შენახვა"}
              </button>
            </div>
          </form>
        </dialog>
      )}
    </div>
  );
}
