'use client';

import React, { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ka';
import styles from "./Calendar.module.scss";

type CalendarProps = {
  // არჩეული დღე ფორმატით "YYYY-MM-DD"
  selectedDate: string;
  onSelect: (date: string) => void;
  // დღეები, რომლებზეც ვიზიტებია (წერტილით აღინიშნება)
  markedDates?: string[];
  // პაციენტისთვის წარსული დღეები და კვირა გამორთულია
  disablePast?: boolean;
};

export default function Calendar({
  selectedDate,
  onSelect,
  markedDates = [],
  disablePast = false,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(() =>
    selectedDate ? dayjs(selectedDate) : dayjs(),
  );

  // თვის და წლის სათაური ქართულად (მაგ: "ოქტომბერი 2026")
  const monthYearString = currentDate.locale('ka').format('MMMM YYYY');

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
        <button type="button" className={styles.navBtn} onClick={handlePrevMonth} aria-label="წინა თვე">
          ‹
        </button>
        <h2>{monthYearString}</h2>
        <button type="button" className={styles.navBtn} onClick={handleNextMonth} aria-label="შემდეგი თვე">
          ›
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
          const dateString = dateObj.format('YYYY-MM-DD');
          const isToday = dayjs().isSame(dateObj, 'day');
          const isSelected = selectedDate === dateString;
          const isMarked = markedDates.includes(dateString);
          const isDisabled =
            disablePast && (dateObj.isBefore(dayjs(), 'day') || dateObj.day() === 0);

          // დინამიკური კლასების გაერთიანება
          const dayClasses = [
            styles.dayBtn,
            isToday ? styles.today : '',
            isSelected ? styles.selected : '',
            isMarked ? styles.marked : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              type="button"
              key={day}
              className={dayClasses}
              disabled={isDisabled}
              onClick={() => onSelect(dateString)}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* არჩეული თარიღის გამოჩენა */}
      <div className={styles.footer}>
        არჩეულია: <strong>{selectedDate || '—'}</strong>
      </div>
    </div>
  );
}
