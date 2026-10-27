"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { navStore, useNav } from "./nav-store";

type SidebarDrawerProps = {
  className: string;
  backdropClassName: string;
  children: React.ReactNode;
};

// sidebar-ის ჩარჩო: ტაბლეტზე და ზემოთ ჩვეულებრივი გვერდითი მენიუა, მობილურზე კი
// მარცხნიდან გამოსაწევი პანელი (გახსნა/დახურვა — Header-ის hamburger ღილაკით).
// იხურება: ბმულზე დაჭერით, ფონზე დაჭერით, Esc-ით და გვერდის შეცვლისას
export default function SidebarDrawer({ className, backdropClassName, children }: SidebarDrawerProps) {
  const { open } = useNav();
  const pathname = usePathname();
  const panelRef = useRef<HTMLElement>(null);

  // გვერდზე sidebar არის → Header-ში hamburger ჩნდება
  useEffect(() => navStore.register(), []);

  // სხვა გვერდზე გადასვლისას მენიუ იხურება
  useEffect(() => {
    navStore.close();
  }, [pathname]);

  // ფართო ეკრანზე გადასვლისას (მაგ: ტელეფონის შემობრუნება) მენიუ იხურება
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 769px)");
    const onChange = () => desktop.matches && navStore.close();
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  // გახსნილ მენიუში: ფონი არ სქროლდება, Esc ხურავს, ფოკუსი პირველ ბმულზე გადადის
  useEffect(() => {
    if (!open) return;

    document.body.classList.add("navOpen");
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") navStore.close();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.classList.remove("navOpen");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <div className={backdropClassName} data-open={open} onClick={navStore.close} aria-hidden="true" />
      <aside
        id="main-menu"
        ref={panelRef}
        className={className}
        data-open={open}
        // ბმულზე დაჭერა მენიუს ხურავს (იმავე გვერდზეც)
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) navStore.close();
        }}
      >
        {children}
      </aside>
    </>
  );
}
