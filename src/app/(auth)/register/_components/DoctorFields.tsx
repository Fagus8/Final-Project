"use client";

import type { FormikProps } from "formik";
import { useEffect, useState } from "react";
import FormField from "./FormField";
import type { RegistrationValues } from "./registration-schema";
import styles from "../Register.module.scss";

type ClinicOption = { id: string; name: string; city: string };

// ექიმის დამატებითი ველები: სპეციალობა, გამოცდილება და კლინიკა
export default function DoctorFields({ formik }: { formik: FormikProps<RegistrationValues> }) {
  const [clinics, setClinics] = useState<ClinicOption[]>([]);

  // დამტკიცებული კლინიკების სია ჩამოსაშლელი მენიუსთვის
  useEffect(() => {
    fetch("/api/clinics")
      .then((response) => response.json())
      .then((result) => setClinics(result.clinics ?? []))
      .catch(() => setClinics([]));
  }, []);

  const clinicError = formik.touched.doctorClinicId && formik.errors.doctorClinicId;

  return (
    <section className={styles.clinicSection}>
      <h3 className={styles.sectionTitle}>ექიმის ინფორმაცია</h3>

      <FormField formik={formik} name="doctorSpecialty" label="სპეციალობა" placeholder="მაგ: კარდიოლოგი" />
      <FormField
        formik={formik}
        name="doctorExperience"
        type="number"
        min="0"
        step="1"
        label="გამოცდილება — წელი"
      />

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
        {clinicError && <div className={styles["error-text"]}>{clinicError}</div>}
      </div>

      <p>რეგისტრაციის შემდეგ კლინიკა დაადასტურებს, რომ მასთან მუშაობ.</p>
    </section>
  );
}
