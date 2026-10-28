"use client";

import { useEffect, useRef, useState } from "react";
import { statusLabels } from "@/lib/appointment-status";
import list from "@/components/ui/List.module.scss";
import dialogStyles from "@/components/appointments/AppointmentActions.module.scss";
import styles from "../DoctorPatients.module.scss";

type Visit = {
  id: string;
  dateTime: string;
  status: string;
  diagnosis: string | null;
  prescription: string | null;
  cancelText: string | null;
};

export type PatientCardData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  bloodType: string | null;
  completedVisits: number;
  lastVisit: string | null;
  lastDiagnosis: string | null;
  nextVisit: string | null;
  // ახლიდან ძველისკენ
  visits: Visit[];
};

// პაციენტის ბარათი. დაჭერით იხსნება მოდალური ფანჯარა ამ პაციენტის
// ყველა ვიზიტით ამ ექიმთან (<dialog>: Esc-ით იხურება, ფოკუსი შიგნით რჩება)
export default function PatientCard({ patient }: { patient: PatientCardData }) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const titleId = `patient-visits-${patient.id}`;

  return (
    <>
      <article
        className={styles.patient}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label={`${patient.name} — ყველა ვიზიტი`}
        onClick={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        <header className={styles.header}>
          <span className={styles.initial} aria-hidden="true">
            {patient.name.charAt(0)}
          </span>
          <div>
            <h2>{patient.name}</h2>
            <p>{patient.email}</p>
          </div>
        </header>

        <ul className={styles.tags}>
          {patient.phone && <li>{patient.phone}</li>}
          {patient.bloodType && <li>სისხლის ჯგუფი {patient.bloodType}</li>}
          <li>ვიზიტები: {patient.completedVisits}</li>
        </ul>

        <dl className={styles.details}>
          <div>
            <dt>ბოლო ვიზიტი</dt>
            <dd>{patient.lastVisit ?? "—"}</dd>
          </div>
          <div>
            <dt>შემდეგი ვიზიტი</dt>
            <dd>{patient.nextVisit ?? "—"}</dd>
          </div>
        </dl>

        <div className={styles.diagnosis}>
          <span>ბოლო დიაგნოზი</span>
          <p>{patient.lastDiagnosis ?? "—"}</p>
        </div>

        <span className={styles.more}>ყველა ვიზიტი ({patient.visits.length}) →</span>
      </article>

      <dialog
        ref={dialogRef}
        className={dialogStyles.dialog}
        aria-labelledby={titleId}
        onClose={() => setIsOpen(false)}
        // ფონზე (ფანჯრის გარეთ) დაჭერა ფანჯარას ხურავს
        onClick={(event) => {
          if (event.target === event.currentTarget) setIsOpen(false);
        }}
      >
        <div className={styles.visitsDialog}>
          <div className={dialogStyles.dialogHeader}>
            <div>
              <h2 id={titleId}>{patient.name}</h2>
              <p className={styles.dialogSubtitle}>ყველა ვიზიტი ({patient.visits.length})</p>
            </div>
            <button
              type="button"
              className={dialogStyles.closeButton}
              aria-label="დახურვა"
              onClick={() => setIsOpen(false)}
            >
              ×
            </button>
          </div>

          <ul className={styles.visits}>
            {patient.visits.map((visit) => (
              <li key={visit.id}>
                <h3>
                  {visit.dateTime}
                  <span className={`${list.status} ${list[visit.status]}`}>
                    {statusLabels[visit.status]}
                  </span>
                </h3>
                {visit.cancelText && <p className={list.cancelInfo}>{visit.cancelText}</p>}
                {visit.diagnosis && (
                  <p>
                    <strong>დიაგნოზი:</strong> {visit.diagnosis}
                  </p>
                )}
                {visit.prescription && (
                  <p className={styles.prescription}>
                    <strong>დანიშნულება:</strong> {visit.prescription}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </dialog>
    </>
  );
}
