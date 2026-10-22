"use client";

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
};

// რეგისტრაციის ფორმის ერთი ველი: წარწერა, input და შეცდომის ტექსტი.
// შეცდომა ჩანს მხოლოდ მაშინ, როცა მომხმარებელი ველს უკვე შეეხო
export default function FormField({ formik, name, label, id = name, type = "text", ...inputProps }: FormFieldProps) {
  // getIn ჩადგმულ მნიშვნელობასაც პოულობს, მაგ: errors.doctors[0].name
  const error = getIn(formik.touched, name) && getIn(formik.errors, name);

  return (
    <div className={styles["input-field"]}>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} {...inputProps} {...formik.getFieldProps(name)} />
      {error && <div className={styles["error-text"]}>{error}</div>}
    </div>
  );
}
