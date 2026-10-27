"use client";

import { useState } from "react";
import Calendar from "@/components/ui/Calendar";
import AppointmentActions from "@/components/appointments/AppointmentActions";
import list from "@/components/ui/List.module.scss";
import { statusLabels } from "@/lib/appointment-status";
import { formatLongDay } from "@/lib/time";
import styles from "../../Staff.module.scss";

export type ScheduleItem = {
  id: string;
  day: string; // "2026-10-15"
  time: string; // "10:30"
  status: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string | null;
  diagnosis: string | null;
  prescription: string | null;
  // „გააუქმა პაციენტმა: ...“ — მხოლოდ გაუქმებულ ვიზიტს აქვს
  cancelText: string | null;
  // რამდენჯერ ყოფილა ეს პაციენტი ამ ექიმთან ადრე და ბოლო დიაგნოზები
  previousVisits: number;
  previousDiagnoses: { date: string; diagnosis: string }[];
  // დიაგნოზი მხოლოდ მაშინ იწერება, როცა ვიზიტის დრო დადგა
  hasStarted: boolean;
};

export default function DoctorAppointments({ items, today }: { items: ScheduleItem[]; today: string }) {
  const [selectedDate, setSelectedDate] = useState(today);

  // დღეები, რომლებზეც აქტიური ვიზიტებია
  const markedDates = items.filter((item) => item.status !== "CANCELLED").map((item) => item.day);
  const dayItems = items.filter((item) => item.day === selectedDate);

  return (
    <div className={styles.schedule}>
      <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} markedDates={markedDates} />

      <section className={styles.dayList}>
        <h2>ვიზიტები: {formatLongDay(selectedDate)}</h2>
        {dayItems.length === 0 ? (
          <p className={list.empty}>ამ დღეს ვიზიტები არ არის.</p>
        ) : (
          <ul className={list.list}>
            {dayItems.map((item) => {
              // გასული დაჯავშნილი ვიზიტი დიაგნოზს ელოდება
              const status = item.status === "BOOKED" && item.hasStarted ? "PAST" : item.status;

              return (
                <li key={item.id} className={list.item}>
                  <div className={list.info}>
                    <h3>
                      {item.time}
                      <span className={`${list.status} ${list[status]}`}>{statusLabels[status]}</span>
                    </h3>
                    <p>
                      {item.patientName} · {item.patientEmail}
                      {item.patientPhone && (
                        <>
                          {" "}· <a href={`tel:${item.patientPhone.replace(/\s/g, "")}`}>{item.patientPhone}</a>
                        </>
                      )}
                    </p>
                    <p>წინა ვიზიტები: {item.previousVisits}</p>
                    {item.cancelText && <p className={list.cancelInfo}>{item.cancelText}</p>}
                    {item.previousDiagnoses.length > 0 && (
                      <details className={list.more}>
                        <summary>წინა დიაგნოზები</summary>
                        <ul>
                          {item.previousDiagnoses.map((previous) => (
                            <li key={previous.date}>
                              {previous.date} — {previous.diagnosis}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                    {item.diagnosis && (
                      <p className={list.note}>
                        <strong>დიაგნოზი:</strong> {item.diagnosis}
                        {item.prescription && (
                          <>
                            <br />
                            <strong>დანიშნულება:</strong> {item.prescription}
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  {/* ექიმი მხოლოდ დიაგნოზს წერს; ვიზიტს აუქმებს პაციენტი ან კლინიკა */}
                  {item.status !== "CANCELLED" && item.hasStarted && (
                    <AppointmentActions
                      appointmentId={item.id}
                      canComplete
                      diagnosis={item.diagnosis}
                      prescription={item.prescription}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
