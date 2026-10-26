"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import formStyles from "@/components/ui/InlineForm.module.scss";
import { sendRequest } from "@/lib/api-client";

// მოწვეული ექიმი, რომელსაც მოთხოვნა ჯერ არ გაუგზავნია (მაგ. კლინიკამ ის
// ექიმის რეგისტრაციის შემდეგ დაამატა) — ერთი ღილაკით აგზავნის მომწვევ კლინიკაში
export default function AcceptInvitationButton() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function accept() {
    setIsSaving(true);
    setMessage("");

    const result = await sendRequest("/api/doctor-invitation", "POST");

    setIsSaving(false);
    setMessage(result.message);
    if (result.ok) {
      router.refresh();
    }
  }

  return (
    <div className={formStyles.form}>
      <button type="button" disabled={isSaving} onClick={accept}>
        {isSaving ? "იგზავნება..." : "მოწვევის მიღება"}
      </button>
      {message && <p className={formStyles.message}>{message}</p>}
    </div>
  );
}
