"use client";

import type { FormikProps } from "formik";
import FormField from "./FormField";
import type { RegistrationValues } from "./registration-schema";
import styles from "../Register.module.scss";

// ექიმის დამატებითი ველები: სპეციალობა და გამოცდილება.
// კლინიკას ექიმი რეგისტრაციის შემდეგ აირჩევს („ჩემი განრიგი“)
export default function DoctorFields({ formik }: { formik: FormikProps<RegistrationValues> }) {
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

      <p>
        რეგისტრაციის შემდეგ აირჩევ კლინიკას და მას მოთხოვნა გაეგზავნება. სპეციალობას და
        გამოცდილებას კლინიკა დაადასტურებს; შემდეგ მათ მხოლოდ კლინიკა ცვლის.
      </p>
    </section>
  );
}
