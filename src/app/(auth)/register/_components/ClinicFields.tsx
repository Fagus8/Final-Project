"use client";

import { FieldArray, type FormikProps } from "formik";
import FormField from "./FormField";
import type { RegistrationValues } from "./registration-schema";
import styles from "../Register.module.scss";

// რეგისტრაციის ფორმის ნაწილი კლინიკისთვის: კლინიკის მონაცემები,
// ანგარიში (ელფოსტა, პაროლი) და ექიმების სია.
// ველები და შეცდომები საერთო formik-იდან მოდის (register/page.tsx)
export default function ClinicFields({ formik }: { formik: FormikProps<RegistrationValues> }) {
  return (
    <section className={styles.clinicSection}>
      <h3 className={styles.sectionTitle}>კლინიკის ინფორმაცია</h3>

      <FormField formik={formik} name="clinicName" label="კლინიკის სახელი" />
      <FormField formik={formik} name="city" label="ქალაქი" />
      <FormField formik={formik} name="address" label="კლინიკის მისამართი" />
      <FormField formik={formik} name="phone" id="clinicPhone" label="კლინიკის ტელეფონი" />
      <FormField formik={formik} name="specialty" label="კლინიკის პროფილი / სპეციალიზაცია" />
      <FormField formik={formik} name="imageUrl" type="url" label="პროფილის სურათის ბმული (არასავალდებულო)" />

      <h3 className={styles.sectionTitle}>კლინიკის ანგარიშის მონაცემები</h3>

      <FormField formik={formik} name="email" id="clinicEmail" type="email" label="კლინიკის ელ.ფოსტა" />
      <FormField formik={formik} name="password" id="clinicPassword" type="password" label="პაროლი" />

      <h3 className={styles.sectionTitle}>კლინიკის ექიმები</h3>

      {/* ექიმების დინამიკური სია: push ამატებს, remove შლის */}
      <FieldArray name="doctors">
        {({ push, remove }) => (
          <div className={styles.doctorList}>
            {formik.values.doctors.map((_, index) => (
              <fieldset key={index} className={styles.doctorCard}>
                <legend className={styles.doctorLegend}>ექიმი {index + 1}</legend>

                <FormField
                  formik={formik}
                  name={`doctors.${index}.name`}
                  id={`doctor-${index}-name`}
                  label="ექიმის სახელი და გვარი"
                />
                <FormField
                  formik={formik}
                  name={`doctors.${index}.specialty`}
                  id={`doctor-${index}-specialty`}
                  label="სპეციალიზაცია"
                />
                <FormField
                  formik={formik}
                  name={`doctors.${index}.experienceYears`}
                  id={`doctor-${index}-experience`}
                  type="number"
                  min="0"
                  step="1"
                  label="გამოცდილება — წელი"
                />
                <FormField
                  formik={formik}
                  name={`doctors.${index}.email`}
                  id={`doctor-${index}-email`}
                  type="email"
                  label="ექიმის ელ.ფოსტა (ანგარიშის დასაკავშირებლად)"
                />

                {/* მინიმუმ ერთი ექიმი უნდა დარჩეს */}
                {formik.values.doctors.length > 1 && (
                  <button type="button" className={styles.doctorRemoveButton} onClick={() => remove(index)}>
                    ექიმის წაშლა
                  </button>
                )}
              </fieldset>
            ))}

            <button
              type="button"
              className={styles.addDoctorButton}
              onClick={() => push({ name: "", specialty: "", experienceYears: 0, email: "" })}
            >
              ექიმის დამატება
            </button>
          </div>
        )}
      </FieldArray>
    </section>
  );
}
