"use client";

import React from "react";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { z } from "zod"; // 1. შემოგვაქვს Zod ბიბლიოთეკა
import styles from "./register.module.scss";
type AccountType = "PATIENT" | "DOCTOR" | "CLINIC";

// 2. ვქმნით Zod სქემას (Schema) - აქ ვწერთ ყველა წესს ერთად, ლამაზად და სტრუქტურულად
const registerSchema = z.object({
  fullName: z.string().min(1, "სახელი და გვარი სავალდებულოა"),
  email: z.string().email("არავალიდური ელ.ფოსტის ფორმატი"), // Zod-ს ავტომატურად აქვს ელ.ფოსტის შემოწმება!
  password: z.string().min(6, "პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო"),
  phone: z.string().min(1, "ტელეფონის ნომერი სავალდებულოა"),
  accountType: z.enum(["PATIENT", "DOCTOR", "CLINIC"]),
});

export default function RegisterPage() {
  const router = useRouter();

  const formik = useFormik({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      phone: "",
      accountType: "PATIENT" as AccountType,
    },

    // 3. ვალიდაციაში Zod-ის შემოწმებას ვრთავთ safeParse-ის მეშვეობით
    validate: (values) => {
      // safeParse ამოწმებს values-ს ჩვენი სქემის მიხედვით
      const result = registerSchema.safeParse(values);

      // თუ ვალიდაციამ წარმატებით ჩაიარა (შეცდომა არ არის)
      if (result.success) {
        return {}; // ვაბრუნებთ ცარიელ ობიექტს
      }

      // თუ შეცდომებია, Zod გვაძლევს მათ სიას, რომელსაც ვაფორმებთ Formik-ისთვის გასაგებ ფორმატში
      const errors: Record<string, string> = {};

      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string; // ინპუტის სახელი (მაგ: email, password)
        if (path) {
          errors[path] = issue.message; // Zod-ის მიერ განსაზღვრული შეცდომის ტექსტი
        }
      });

      return errors;
    },

    onSubmit: async (values, { setStatus }) => {
      const { error } = await authClient.signUp.email({
        name: values.fullName.trim(),
        email: values.email.trim(),
        password: values.password,
        accountType: values.accountType,
      });

      if (error) {
        setStatus(error.message);
        return;
      }

      router.push("/");
    },
  });

  return (
    <div className={styles["form-wrapper"]}>
      <h2>რეგისტრაცია </h2>

      <form onSubmit={formik.handleSubmit}>

        {/* სახელი და გვარი */}
        <div className={styles["input-field"]}>
          <label>სახელი და გვარი</label>
          <input type="text" {...formik.getFieldProps("fullName")} />
          {formik.touched.fullName && formik.errors.fullName ? (
            <div className={styles["error-text"]}>{formik.errors.fullName}</div>
          ) : null}
        </div>

        {/* ელ.ფოსტა */}
        <div className={styles["input-field"]}>
          <label>ელ.ფოსტა</label>
          <input type="email" {...formik.getFieldProps("email")} />
          {formik.touched.email && formik.errors.email ? (
            <div className={styles["error-text"]}>{formik.errors.email}</div>
          ) : null}
        </div>

        {/* პაროლი */}
        <div className={styles["input-field"]}>
          <label>პაროლი</label>
          <input type="password" {...formik.getFieldProps("password")} />
          {formik.touched.password && formik.errors.password ? (
            <div className={styles["error-text"]}>{formik.errors.password}</div>
          ) : null}
        </div>

        {/* ტელეფონი */}
        <div className={styles["input-field"]}>
          <label>ტელეფონი</label>
          <input type="text" {...formik.getFieldProps("phone")} />
          {formik.touched.phone && formik.errors.phone ? (
            <div className={styles["error-text"]}>{formik.errors.phone}</div>
          ) : null}
        </div>

        <div className={styles["input-field"]}>
          <label htmlFor="accountType">ანგარიშის ტიპი</label>
          <select id="accountType" {...formik.getFieldProps("accountType")}>
            <option value="PATIENT">მომხმარებელი</option>
            <option value="DOCTOR">ექიმი</option>
            <option value="CLINIC">კლინიკა</option>
          </select>
        </div>

        {formik.status && (
          <div className={styles["error-text"]} role="alert">
            {formik.status}
          </div>
        )}

        {/* გაგზავნის ღილაკი */}
        <button type="submit" disabled={formik.isSubmitting}>
          {formik.isSubmitting ? "იგზავნება..." : "რეგისტრაცია"}
        </button>

      </form>
    </div>
  );
}
