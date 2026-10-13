"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import styles from "./Header.module.scss";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogout() {
    setIsLoggingOut(true);
    setErrorMessage("");

    const { error } = await authClient.signOut();

    if (error) {
      setErrorMessage(error.message || "გამოსვლისას შეცდომა მოხდა.");
      setIsLoggingOut(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className={styles.logoutButton}
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? "გამოსვლა..." : "გამოსვლა"}
      </button>

      {errorMessage && <span role="alert">{errorMessage}</span>}
    </>
  );
}
