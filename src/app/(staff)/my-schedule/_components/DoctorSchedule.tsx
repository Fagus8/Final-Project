"use client";

import { useState } from "react";
import Calendar from "@/components/ui/Calendar";
import AppointmentActions from "@/components/appointments/AppointmentActions";
import list from "@/components/appointments/AppointmentList.module.scss";
import { statusLabels } from "@/lib/slots";
import styles from "../../Staff.module.scss";

export type ScheduleItem = {
  id: string;
  day: string; // "2026-10-15"
  time: string; // "10:30"
  status: string;
  patientName: string;
  patientEmail: string;
  diagnosis: string | null;
  prescription: string | null;
  // რამდენჯერ ყოფილა ეს პაციენტი ამ ექიმთან ადრე
  previousVisits: number;
};

export default function DoctorSchedule({ items, today }: { items: ScheduleItem[]; today: string }) {
  const [selectedDate, setSelectedDate] = useState(today);

  // დღეები, რომლებზეც აქტიური ვიზიტებია
  const markedDates = items.filter((item) => item.status !== "CANCELLED").map((item) => item.day);
  const dayItems = items.filter((item) => item.day === selectedDate);

  return (
    <div className={styles.schedule}>
      <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} markedDates={markedDates} />

      <section className={styles.dayList}>
        <h2>ვიზიტები: {selectedDate}</h2>
        {dayItems.length === 0 ? (
          <p className={list.empty}>ამ დღეს ვიზიტები არ არის.</p>
        ) : (
          <ul className={list.list}>
            {dayItems.map((item) => (
              <li key={item.id} className={list.item}>
                <div className={list.info}>
                  <h3>
                    {item.time}
                    <span className={`${list.status} ${list[item.status]}`}>
                      {statusLabels[item.status]}
                    </span>
                  </h3>
                  <p>{item.patientName} · {item.patientEmail}</p>
                  <p>წინა ვიზიტები: {item.previousVisits}</p>
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
                {item.status !== "CANCELLED" && (
                  <AppointmentActions
                    appointmentId={item.id}
                    canCancel={item.status === "BOOKED"}
                    canComplete
                    diagnosis={item.diagnosis}
                    prescription={item.prescription}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
