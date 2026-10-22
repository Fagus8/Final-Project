"use client";

import type { FormikProps } from "formik";
import { BLOOD_TYPES } from "@/lib/blood-types";
import FormField from "./FormField";
import type { RegistrationValues } from "./registration-schema";
import styles from "../Register.module.scss";

// რეგისტრაციის ფორმის ნაწილი პაციენტისა და ექიმისთვის:
// სახელი, ელფოსტა, პაროლი, ტელეფონი (+ სისხლის ჯგუფი პაციენტს)
export default function PersonalFields({ formik }: { formik: FormikProps<RegistrationValues> }) {
  return (
    <>
      <FormField formik={formik} name="fullName" label="სახელი და გვარი" />
      <FormField formik={formik} name="email" id="patientEmail" type="email" label="ელ.ფოსტა" />
      <FormField formik={formik} name="password" id="patientPassword" type="password" label="პაროლი" />
      <FormField formik={formik} name="phone" id="patientPhone" label="ტელეფონი" />

      {formik.values.accountType === "PATIENT" && (
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
      )}
    </>
  );
}
