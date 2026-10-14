"use client";

import type { FormikProps } from "formik";
import type { RegistrationValues } from "./registration-schema";
import styles from "../Register.module.scss";

type PersonalFieldsProps = {
  formik: FormikProps<RegistrationValues>;
};

export default function PersonalFields({ formik }: PersonalFieldsProps) {
  return (
    <>
      <div className={styles["input-field"]}>
        <label htmlFor="fullName">სახელი და გვარი</label>
        <input id="fullName" type="text" {...formik.getFieldProps("fullName")} />
        {formik.touched.fullName && formik.errors.fullName ? (
          <div className={styles["error-text"]}>{formik.errors.fullName}</div>
        ) : null}
      </div>

      <div className={styles["input-field"]}>
        <label htmlFor="patientEmail">ელ.ფოსტა</label>
        <input id="patientEmail" type="email" {...formik.getFieldProps("email")} />
        {formik.touched.email && formik.errors.email ? (
          <div className={styles["error-text"]}>{formik.errors.email}</div>
        ) : null}
      </div>

      <div className={styles["input-field"]}>
        <label htmlFor="patientPassword">პაროლი</label>
        <input
          id="patientPassword"
          type="password"
          {...formik.getFieldProps("password")}
        />
        {formik.touched.password && formik.errors.password ? (
          <div className={styles["error-text"]}>{formik.errors.password}</div>
        ) : null}
      </div>

      <div className={styles["input-field"]}>
        <label htmlFor="patientPhone">ტელეფონი</label>
        <input id="patientPhone" type="text" {...formik.getFieldProps("phone")} />
        {formik.touched.phone && formik.errors.phone ? (
          <div className={styles["error-text"]}>{formik.errors.phone}</div>
        ) : null}
      </div>
    </>
  );
}
