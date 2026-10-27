"use client";

import type { FormikProps } from "formik";
import FormField from "./FormField";
import type { RegistrationValues } from "./registration-schema";
import styles from "../Register.module.scss";

// რეგისტრაციის ფორმის ნაწილი კლინიკისთვის: კლინიკის მონაცემები და
// ანგარიში (ელფოსტა, პაროლი). ექიმები კლინიკას თვითონ ირჩევენ.
// ველები და შეცდომები საერთო formik-იდან მოდის (register/page.tsx)
export default function ClinicFields({ formik }: { formik: FormikProps<RegistrationValues> }) {
  return (
    <section className={styles.clinicSection}>
      <h3 className={styles.sectionTitle}>კლინიკის ინფორმაცია</h3>

      <FormField formik={formik} name="clinicName" label="კლინიკის სახელი" />
      <FormField formik={formik} name="city" label="ქალაქი" />
      <FormField formik={formik} name="address" label="კლინიკის მისამართი" />
      <FormField formik={formik} name="phone" id="clinicPhone" type="tel" label="კლინიკის ტელეფონი" />
      <FormField formik={formik} name="specialty" label="კლინიკის პროფილი / სპეციალიზაცია" />
      <FormField formik={formik} name="imageUrl" type="url" label="პროფილის სურათის ბმული (არასავალდებულო)" />

      <h3 className={styles.sectionTitle}>კლინიკის ანგარიშის მონაცემები</h3>

      <FormField formik={formik} name="email" id="clinicEmail" type="email" label="კლინიკის ელ.ფოსტა" />
      <FormField
        formik={formik}
        name="password"
        id="clinicPassword"
        type="password"
        label="პაროლი (მინიმუმ 6 სიმბოლო)"
        autoComplete="new-password"
      />
      <FormField
        formik={formik}
        name="passwordRepeat"
        id="clinicPasswordRepeat"
        type="password"
        label="გაიმეორე პაროლი"
        autoComplete="new-password"
      />

      <p>რეგისტრაციის შემდეგ კლინიკას ადმინისტრატორი დაამტკიცებს — მანამდე ის საიტზე არ ჩანს.</p>
    </section>
  );
}
