"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/Icon";
import styles from "./Sidebar.module.scss";

type NavLinkProps = {
  href: string;
  label: string;
  icon: IconName;
};

// Sidebar-ის ბმული, რომელიც მიმდინარე გვერდზე გამოკვეთილია
export default function NavLink({ href, label, icon }: NavLinkProps) {
  const pathname = usePathname();
  // აქტიურია ზუსტად ამ გვერდზეც და მის ქვეგვერდებზეც (მაგ: /doctors/123)
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={`${styles.navItem} ${isActive ? styles.active : ""}`}
      aria-current={isActive ? "page" : undefined}
      // ვიწრო ეკრანზე მხოლოდ ხატულა ჩანს — სახელი მაშინაც უნდა იკითხებოდეს
      aria-label={label}
      title={label}
    >
      <span className={styles.icon}>
        <Icon name={icon} />
      </span>
      <span>{label}</span>
    </Link>
  );
}
