"use client";

import type { FormikProps } from "formik";
import { BLOOD_TYPES } from "@/lib/blood-types";
import FormField from "./FormField";
import type { RegistrationValues } from "./registration-schema";
import styles from "../Register.module.scss";

// რეგისტრაციის ფორმის ნაწილი პაციენტისა და ექიმისთვის:
// სახელი, ელფოსტა, პაროლი (+ ტელეფონი და სისხლის ჯგუფი პაციენტს)
export default function PersonalFields({ formik }: { formik: FormikProps<RegistrationValues> }) {
  const isPatient = formik.values.accountType === "PATIENT";

  return (
    <>
      <FormField formik={formik} name="fullName" label="სახელი და გვარი" autoComplete="name" />
      <FormField formik={formik} name="email" id="patientEmail" type="email" label="ელ.ფოსტა" autoComplete="email" />
      <FormField
        formik={formik}
        name="password"
        id="patientPassword"
        type="password"
        label="პაროლი (მინიმუმ 6 სიმბოლო)"
        autoComplete="new-password"
      />
      <FormField
        formik={formik}
        name="passwordRepeat"
        id="patientPasswordRepeat"
        type="password"
        label="გაიმეორე პაროლი"
        autoComplete="new-password"
      />

      {isPatient && (
        <>
          <FormField formik={formik} name="phone" id="patientPhone" type="tel" label="ტელეფონი" autoComplete="tel" />
          <div className={styles["input-field"]}>
            <label htmlFor="bloodType">სისხლის ჯგუფი</label>
            {/* ცარიელი მნიშვნელობა = „ჯერ არ ვიცი“, ბაზაში null ინახება */}
            <select id="bloodType" {...formik.getFieldProps("bloodType")}>
              <option value="">ჯერ არ ვიცი</option>
              {BLOOD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </>
  );
}
