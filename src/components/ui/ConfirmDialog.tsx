"use client";

import { useEffect, useId, useRef, useState } from "react";
import list from "./List.module.scss";
import styles from "./ConfirmDialog.module.scss";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  // თუ მითითებულია, ფანჯარაში მიზეზის (არასავალდებულო) ველი ჩანს
  reasonLabel?: string;
  isBusy?: boolean;
  error?: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
};

// დადასტურების მოდალური ფანჯარა სახიფათო მოქმედებებისთვის (გაუქმება, უარყოფა, მოხსნა).
// <dialog>: Esc-ით იხურება, ფოკუსი შიგნით რჩება — ბრაუზერის confirm()-ის ნაცვლად
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  reasonLabel,
  isBusy = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [reason, setReason] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      // დახურვისას მიზეზის ველი სუფთავდება, რომ შემდეგ გახსნაზე ცარიელი იყოს
      onClose={() => {
        setReason("");
        onClose();
      }}
      // ფონზე (ფანჯრის გარეთ) დაჭერა ფანჯარას ხურავს
      onClick={(event) => {
        if (event.target === event.currentTarget && !isBusy) onClose();
      }}
    >
      <form
        className={styles.body}
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm(reason.trim());
        }}
      >
        <h2 id={titleId}>{title}</h2>
        <div className={styles.message}>{message}</div>

        {reasonLabel && (
          <label>
            {reasonLabel}
            <textarea
              rows={3}
              maxLength={300}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        )}

        {error && <p className={list.error} role="alert">{error}</p>}

        <div className={styles.buttons}>
          <button type="button" className={styles.secondaryButton} disabled={isBusy} onClick={onClose}>
            არა, დახურვა
          </button>
          <button type="submit" className={list.cancelButton} disabled={isBusy}>
            {isBusy ? "იგზავნება..." : confirmLabel}
          </button>
        </div>
      </form>
    </dialog>
  );
}
