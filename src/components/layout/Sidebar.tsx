import Link from "next/link";
import Icon, { type IconName } from "@/components/ui/Icon";
import { getSession } from "@/lib/session";
import NavLink from "./NavLink";
import styles from "./Sidebar.module.scss";

type MenuItem = { href: string; label: string; icon: IconName };

// გვერდითი მენიუ. ბმულები იცვლება იმის მიხედვით, ვინ არის შესული
export default async function Sidebar() {
  const session = await getSession();
  const isAdmin = session?.user.role === "admin";
  const isPatient = session?.user.accountType === "PATIENT";
  const isDoctor = session?.user.accountType === "DOCTOR";
  const isClinic = session?.user.accountType === "CLINIC";

  // დაჯავშნა ჩანს სტუმრისთვის და პაციენტისთვის, კლინიკისა და ექიმისთვის — არა
  const canBook = !session || (isPatient && !isAdmin);

  // საერთო ბმულები — ყველასთვის
  const general: MenuItem[] = [
    { href: "/", label: "მთავარი", icon: "home" },
    { href: "/doctors", label: "ექიმები", icon: "doctors" },
    { href: "/clinics", label: "კლინიკები", icon: "clinic" },
  ];

  if (canBook) {
    general.push({ href: "/booking", label: "ვიზიტის დაჯავშნა", icon: "calendarPlus" });
  }

  // როლის მიხედვით ბმულები, პირველი — პირადი კაბინეტი
  const personal: MenuItem[] = session
    ? [{ href: "/dashboard", label: "პირადი კაბინეტი", icon: "dashboard" }]
    : [];

  if (isPatient && !isAdmin) {
    personal.push(
      { href: "/my-appointments", label: "ჩემი ვიზიტები", icon: "appointments" },
      { href: "/profile", label: "ჩემი პროფილი", icon: "profile" },
    );
  }

  if (isDoctor) {
    personal.push(
      { href: "/my-schedule", label: "ჩემი განრიგი", icon: "appointments" },
      { href: "/my-profile", label: "ჩემი პროფილი", icon: "profile" },
    );
  }

  if (isClinic) {
    personal.push({ href: "/my-clinic", label: "კლინიკის მართვა", icon: "chart" });
  }

  if (isAdmin) {
    personal.push(
      { href: "/admin/clinics", label: "კლინიკების მართვა", icon: "shield" },
      { href: "/admin/patients", label: "პაციენტები", icon: "patients" },
    );
  }

  return (
    <aside className={styles.sidebar}>
      <nav className={styles.navMenu} aria-label="მთავარი მენიუ">
        <p className={styles.groupLabel}>მენიუ</p>
        <ul className={styles.menu}>
          {general.map((item) => (
            <li key={item.href}>
              <NavLink {...item} />
            </li>
          ))}
        </ul>

        {personal.length > 0 && (
          <>
            <p className={styles.groupLabel}>{isAdmin ? "ადმინისტრირება" : "ჩემი სივრცე"}</p>
            <ul className={styles.menu}>
              {personal.map((item) => (
                <li key={item.href}>
                  <NavLink {...item} />
                </li>
              ))}
            </ul>
          </>
        )}

      </nav>

      {/* სტუმრისთვის მოკლე ახსნა, რატომ ღირს შესვლა */}
      {!session && (
        <div className={styles.guestCard}>
          <span className={styles.guestIcon}>
            <Icon name="calendarPlus" size={20} />
          </span>
          <p>შედი ანგარიშში, რომ დაჯავშნო ვიზიტი და ნახო შენი ისტორია.</p>
          <Link href="/register" className={styles.guestButton}>
            დაიწყე უფასოდ
          </Link>
        </div>
      )}
    </aside>
  );
}
