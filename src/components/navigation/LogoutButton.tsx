"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { authClient } from "@/lib/auth-client";
import styles from "./Header.module.scss";

// Header-ის ღილაკი: ანგარიშიდან გასვლა
export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogout() {
    setIsLoggingOut(true);
    setErrorMessage("");

    // better-auth სესიას შლის სერვერზეც და ბრაუზერის cookie-შიც
    const { error } = await authClient.signOut();

    if (error) {
      setErrorMessage(error.message || "გამოსვლისას შეცდომა მოხდა.");
      setIsLoggingOut(false);
      return;
    }

    // replace: „უკან“ ღილაკით დახურულ გვერდზე აღარ დაბრუნდება
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className={styles.iconButton}
        onClick={handleLogout}
        disabled={isLoggingOut}
        aria-label="გამოსვლა"
        title="გამოსვლა"
      >
        <Icon name="logout" />
      </button>

      {errorMessage && <span role="alert">{errorMessage}</span>}
    </>
  );
}
