"use client";

import { useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { authClient } from "@/lib/auth-client";
import styles from "./Login.module.scss";

export default function LoginPage() {
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },

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

    onSubmit: async (values, { setStatus }) => {
      const { error } = await authClient.signIn.email({
        email: values.email.trim(),
        password: values.password,
      });

      if (error) {
        setStatus("ელფოსტა ან პაროლი არასწორია.");
        return;
      }

      router.push("/dashboard");
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
        <p className={styles.subtitle}>შედი ანგარიშში და მართე შენი ვიზიტები</p>

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
          ანგარიში არ გაქვს? <Link href="/register">დარეგისტრირდი</Link>
        </p>
      </section>
    </main>
  );
}
