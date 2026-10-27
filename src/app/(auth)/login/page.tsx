"use client";

import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/next-url";
import styles from "./Login.module.scss";

// შესვლის გვერდი: ელფოსტა და პაროლი. წარმატების შემდეგ — გვერდი, საიდანაც
// მომხმარებელი შესვლაზე გადმოვიდა (?next=), ან პირადი კაბინეტი
export default function LoginPage() {
  const router = useRouter();

  // formik ფორმის მნიშვნელობებს, შეცდომებს და გაგზავნას მართავს
  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },

    // ცარიელი ველები სერვერამდე არ მიდის
    validate: (values) => {
      const errors: { email?: string; password?: string } = {};

      if (!values.email.trim()) {
        errors.email = "ელფოსტა სავალდებულოა";
      }

      if (!values.password) {
        errors.password = "პაროლი სავალდებულოა";
      }

      return errors;
    },

    // better-auth ამოწმებს მონაცემებს და წარმატებისას სესიის cookie-ს აყენებს
    onSubmit: async (values, { setStatus }) => {
      const { error } = await authClient.signIn.email({
        email: values.email.trim(),
        password: values.password,
      });

      // რომელი ველია არასწორი, არ ვამბობთ, რომ სხვისი ელფოსტა ვერ გამოიცნონ
      if (error) {
        setStatus("ელფოსტა ან პაროლი არასწორია.");
        return;
      }

      // ?next= URL-იდან. useSearchParams-ს აქ არ ვიყენებთ — გაგზავნისას URL-ის წაკითხვა საკმარისია
      const next = safeNext(new URLSearchParams(window.location.search).get("next"));

      // refresh საჭიროა, რომ Header-მა და Sidebar-მა ახალი სესია დაინახონ
      router.push(next ?? "/dashboard");
      router.refresh();
    },
  });

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.logo} aria-hidden="true">
          <Icon name="logo" size={22} />
        </span>
        <h1 className={styles.title}>კეთილი იყოს შენი დაბრუნება</h1>
        <p className={styles.subtitle}>შედი medical.ge-ზე და მართე შენი ვიზიტები</p>

        <form className={styles.form} onSubmit={formik.handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="email">ელფოსტა</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...formik.getFieldProps("email")}
            />
            {formik.touched.email && formik.errors.email && (
              <p className={styles.error}>{formik.errors.email}</p>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="password">პაროლი</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...formik.getFieldProps("password")}
            />
            {formik.touched.password && formik.errors.password && (
              <p className={styles.error}>{formik.errors.password}</p>
            )}
          </div>

          {formik.status && (
            <p className={styles.error} role="alert">
              {formik.status}
            </p>
          )}

          <button
            className={styles.submitButton}
            type="submit"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? "მოწმდება..." : "შესვლა"}
          </button>
        </form>

        <p className={styles.switch}>
          ანგარიში არ გაქვს?{" "}
          <Link
            href="/register"
            onClick={(event) => {
              // რეგისტრაციის შემდეგაც იმავე გვერდზე დავბრუნდეთ (მაგ: ჯავშანი)
              const next = safeNext(new URLSearchParams(window.location.search).get("next"));
              if (next) {
                event.preventDefault();
                router.push(`/register?next=${encodeURIComponent(next)}`);
              }
            }}
          >
            დარეგისტრირდი
          </Link>
        </p>
      </section>
    </main>
  );
}
