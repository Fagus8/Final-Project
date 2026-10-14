"use client";

import type { FormikProps } from "formik";
import { useEffect, useState } from "react";
import type { RegistrationValues } from "./registration-schema";
import styles from "../Register.module.scss";

type DoctorFieldsProps = {
  formik: FormikProps<RegistrationValues>;
};

type ClinicOption = { id: string; name: string; city: string };

// ექიმის დამატებითი ველები: სპეციალობა, გამოცდილება და კლინიკა
export default function DoctorFields({ formik }: DoctorFieldsProps) {
  const [clinics, setClinics] = useState<ClinicOption[]>([]);

  // დამტკიცებული კლინიკების სია
  useEffect(() => {
    fetch("/api/clinics")
      .then((response) => response.json())
      .then((result) => setClinics(result.clinics ?? []))
      .catch(() => setClinics([]));
  }, []);

  return (
    <section className={styles.clinicSection}>
      <h3 className={styles.sectionTitle}>ექიმის ინფორმაცია</h3>

      <div className={styles["input-field"]}>
        <label htmlFor="doctorSpecialty">სპეციალობა</label>
        <input id="doctorSpecialty" type="text" placeholder="მაგ: კარდიოლოგი" {...formik.getFieldProps("doctorSpecialty")} />
        {formik.touched.doctorSpecialty && formik.errors.doctorSpecialty ? (
          <div className={styles["error-text"]}>{formik.errors.doctorSpecialty}</div>
        ) : null}
      </div>

      <div className={styles["input-field"]}>
        <label htmlFor="doctorExperience">გამოცდილება — წელი</label>
        <input id="doctorExperience" type="number" min="0" step="1" {...formik.getFieldProps("doctorExperience")} />
        {formik.touched.doctorExperience && formik.errors.doctorExperience ? (
          <div className={styles["error-text"]}>{formik.errors.doctorExperience}</div>
        ) : null}
      </div>

      <div className={styles["input-field"]}>
        <label htmlFor="doctorClinicId">კლინიკა, სადაც მუშაობ</label>
        <select id="doctorClinicId" {...formik.getFieldProps("doctorClinicId")}>
          <option value="">აირჩიე კლინიკა</option>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name} ({clinic.city})
            </option>
          ))}
        </select>
        {formik.touched.doctorClinicId && formik.errors.doctorClinicId ? (
          <div className={styles["error-text"]}>{formik.errors.doctorClinicId}</div>
        ) : null}
      </div>

      <p>რეგისტრაციის შემდეგ კლინიკა დაადასტურებს, რომ მასთან მუშაობ.</p>
    </section>
  );
}
