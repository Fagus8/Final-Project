"use client";

import { useEffect, useState } from "react";
import type { FormikProps } from "formik";
import FormField from "./FormField";
import type { RegistrationValues } from "./registration-schema";
import styles from "../Register.module.scss";

type ClinicOption = { id: string; name: string; city: string };

// ექიმის დამატებითი ველები: სპეციალობა, გამოცდილება და კლინიკა.
// კლინიკას აქვე ირჩევს (მოთხოვნა მაშინვე იგზავნება) ან მოგვიანებით „ჩემ განრიგში“
export default function DoctorFields({ formik }: { formik: FormikProps<RegistrationValues> }) {
  // null — სია ჯერ იტვირთება
  const [clinics, setClinics] = useState<ClinicOption[] | null>(null);

  useEffect(() => {
    let ignore = false;

    fetch("/api/clinics")
      .then((response) => response.json())
      .then((result) => {
        if (!ignore) setClinics(result.clinics ?? []);
      })
      .catch(() => {
        if (!ignore) setClinics([]);
      });

    return () => {
      ignore = true;
    };
  }, []);

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
        <label htmlFor="doctorClinicId">კლინიკა</label>
        <select id="doctorClinicId" disabled={clinics === null} {...formik.getFieldProps("doctorClinicId")}>
          <option value="">
            {clinics === null ? "იტვირთება..." : "მოგვიანებით ავირჩევ"}
          </option>
          {clinics?.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>
              {clinic.name} ({clinic.city})
            </option>
          ))}
        </select>
        <span className={styles.hint}>
          {clinics?.length === 0
            ? "დამტკიცებული კლინიკა ჯერ არ არის. კლინიკას მოგვიანებით „ჩემ განრიგში“ აირჩევ."
            : "არჩეულ კლინიკას მოთხოვნა მაშინვე გაეგზავნება."}
        </span>
      </div>

      <p>
        სპეციალობას და გამოცდილებას კლინიკა დაადასტურებს; შემდეგ მათ მხოლოდ კლინიკა ცვლის.
      </p>
    </section>
  );
}
