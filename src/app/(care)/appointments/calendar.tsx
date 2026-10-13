'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import styles from "./calendar.module.scss";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // თვის და წლის სათაური (მაგ: "October 2026")
  const monthYearString = currentDate.format('MMMM YYYY');

  // გამოვთვალოთ თვის პირველი დღე და დღეების რაოდენობა
  const startOfMonth = currentDate.startOf('month');
  const daysInMonth = currentDate.daysInMonth();

  // კვირის დღის ინდექსი (0 = კვირა). გადავიყვანოთ ორშაბათზე (0 = ორშაბათი, 6 = კვირა)
  const dayOfWeek = startOfMonth.day();
  const firstDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // ცარიელი უჯრები და თვის დღეების მასივი
  const emptyDays = Array(firstDayIndex).fill(null);
  const monthDays = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  // თვეების გადართვა
  const handlePrevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const handleNextMonth = () => setCurrentDate(currentDate.add(1, 'month'));

  return (
    <div className={styles.calendarContainer}>
      {/* ჰედერი */}
      <div className={styles.header}>
        <button className={styles.navBtn} onClick={handlePrevMonth} aria-label="Previous Month">
          &lt;
        </button>
        <h2>{monthYearString}</h2>
        <button className={styles.navBtn} onClick={handleNextMonth} aria-label="Next Month">
          &gt;
        </button>
      </div>

      {/* კვირის დღეები */}
      <div className={styles.weekdays}>
        <span>ორშ</span>
        <span>სამ</span>
        <span>ოთხ</span>
        <span>ხუთ</span>
        <span>პარ</span>
        <span>შაბ</span>
        <span>კვი</span>
      </div>

      {/* დღეების ბადე */}
      <div className={styles.daysGrid}>
        {/* ცარიელი უჯრები თვის დასაწყისში */}
        {emptyDays.map((_, index) => (
          <div key={`empty-${index}`} className={styles.emptyDay} />
        ))}

        {/* თვის დღეები */}
        {monthDays.map((day) => {
          const dateObj = currentDate.date(day);
          const isToday = dayjs().isSame(dateObj, 'day');
          const isSelected = selectedDate.isSame(dateObj, 'day');

          // დინამიკური კლასების გაერთიანება
          const dayClasses = [
            styles.dayBtn,
            isToday ? styles.today : '',
            isSelected ? styles.selected : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              key={day}
              className={dayClasses}
              onClick={() => setSelectedDate(dateObj)}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* არჩეული თარიღის გამოჩენა */}
      <div className={styles.footer}>
        არჩეულია: <strong>{selectedDate.format('YYYY-MM-DD')}</strong>
      </div>
    </div>
  );
}