"use client";

import { useState } from "react";
import formStyles from "@/components/ui/InlineForm.module.scss";
import { authClient } from "@/lib/auth-client";

// პაროლის შეცვლა ნებისმიერი ანგარიშისთვის. სხვა მოწყობილობებზე სესიები იხურება
export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword.length < 6) {
      setResult({ ok: false, message: "ახალი პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო" });
      return;
    }

    if (newPassword !== repeatPassword) {
      setResult({ ok: false, message: "ახალი პაროლები არ ემთხვევა" });
      return;
    }

    setIsSaving(true);
    setResult(null);

    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });

    setIsSaving(false);
    if (error) {
      setResult({ ok: false, message: "მიმდინარე პაროლი არასწორია" });
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setRepeatPassword("");
    setResult({ ok: true, message: "პაროლი შეიცვალა" });
  }

  return (
    <form className={formStyles.form} onSubmit={save}>
      <label>
        მიმდინარე პაროლი
        <input
          required
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </label>
      <label>
        ახალი პაროლი
        <input
          required
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </label>
      <label>
        გაიმეორე ახალი პაროლი
        <input
          required
          type="password"
          autoComplete="new-password"
          value={repeatPassword}
          onChange={(event) => setRepeatPassword(event.target.value)}
        />
      </label>
      <button type="submit" disabled={isSaving}>
        {isSaving ? "ინახება..." : "პაროლის შეცვლა"}
      </button>
      {result && (
        <p className={result.ok ? formStyles.success : formStyles.error} role={result.ok ? "status" : "alert"}>
          {result.message}
        </p>
      )}
    </form>
  );
}
