"use client";

import { useState } from "react";
import { getIn, type FormikProps } from "formik";
import type { RegistrationValues } from "./registration-schema";
import styles from "../Register.module.scss";

type FormFieldProps = {
  formik: FormikProps<RegistrationValues>;
  // ველის სახელი formik-ში, მაგ: "email" ან "doctors.0.name"
  name: string;
  label: string;
  // HTML id; თუ არ მიუთითე, ველის სახელი გამოიყენება
  id?: string;
  type?: string;
  placeholder?: string;
  min?: string;
  step?: string;
  autoComplete?: string;
};

// რეგისტრაციის ფორმის ერთი ველი: წარწერა, input და შეცდომის ტექსტი.
// შეცდომა ჩანს მხოლოდ მაშინ, როცა მომხმარებელი ველს უკვე შეეხო.
// პაროლის ველს „ჩვენება“ ღილაკი აქვს, რომ აკრეფილი შეამოწმო
export default function FormField({ formik, name, label, id = name, type = "text", ...inputProps }: FormFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  // getIn ჩადგმულ მნიშვნელობასაც პოულობს, მაგ: errors.doctors[0].name
  const error = getIn(formik.touched, name) && getIn(formik.errors, name);
  const isPassword = type === "password";

  const input = (
    <input
      id={id}
      type={isPassword && showPassword ? "text" : type}
      aria-invalid={Boolean(error)}
      {...inputProps}
      {...formik.getFieldProps(name)}
    />
  );

  return (
    <div className={styles["input-field"]}>
      <label htmlFor={id}>{label}</label>
      {isPassword ? (
        <div className={styles.passwordWrap}>
          {input}
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? "დამალვა" : "ჩვენება"}
          </button>
        </div>
      ) : (
        input
      )}
      {error && <div className={styles["error-text"]}>{error}</div>}
    </div>
  );
}
