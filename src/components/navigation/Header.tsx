import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { getSession } from "@/lib/session";
import styles from "./Header.module.scss";
import LogoutButton from "./LogoutButton";
import MenuButton from "./MenuButton";

// ანგარიშის ტიპი ქართულად (სახელის ქვეშ ჩანს)
const accountTypeLabels: Record<string, string> = {
  PATIENT: "პაციენტი",
  DOCTOR: "ექიმი",
  CLINIC: "კლინიკა",
};

// ზედა ზოლი ყველა გვერდზე: ლოგო და ანგარიში.
// სტუმარს „შესვლა“ და „რეგისტრაცია“ უჩანს
export default async function Header() {
  const session = await getSession();

  return (
    <header className={styles.header}>
      {/* მობილურზე: მენიუს ღილაკი ლოგოს წინ */}
      <MenuButton />
      <Link href="/" className={styles.brand} aria-label="medical.ge — მთავარ გვერდზე დაბრუნება">
        <span className={styles.logo}>
          <Icon name="logo" size={18} />
        </span>
        <span className={styles.brandName}>
          medical<span className={styles.brandAccent}>.ge</span>
        </span>
      </Link>

      <nav className={styles.actions} aria-label="ანგარიში">
        {session ? (
          <>
            <Link href="/dashboard" className={styles.profileLink}>
              <span className={styles.avatar} aria-hidden="true">
                {session.user.name.trim().charAt(0).toUpperCase()}
              </span>
              <span className={styles.profileText}>
                <span className={styles.profileName}>{session.user.name}</span>
                <span className={styles.profileRole}>
                  {session.user.role === "admin"
                    ? "ადმინისტრატორი"
                    : accountTypeLabels[session.user.accountType] ?? ""}
                </span>
              </span>
            </Link>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link href="/login" className={styles.ghostLink}>
              შესვლა
            </Link>
            <Link href="/register" className={styles.primaryLink}>
              რეგისტრაცია
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
