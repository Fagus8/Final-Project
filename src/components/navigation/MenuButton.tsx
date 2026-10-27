"use client";

import { navStore, useNav } from "./nav-store";
import styles from "./Header.module.scss";

// hamburger ღილაკი Header-ში. ჩანს მხოლოდ 768px-მდე (CSS) და მხოლოდ იმ
// გვერდებზე, სადაც sidebar არის. გახსნილზე „×“-ად გარდაიქმნება
export default function MenuButton() {
  const { open, drawers } = useNav();

  if (drawers === 0) {
    return null;
  }

  return (
    <button
      type="button"
      className={styles.menuButton}
      aria-expanded={open}
      aria-controls="main-menu"
      aria-label={open ? "მენიუს დახურვა" : "მენიუს გახსნა"}
      onClick={navStore.toggle}
    >
      <span className={styles.burger} data-open={open} aria-hidden="true">
        <span />
      </span>
    </button>
  );
}
