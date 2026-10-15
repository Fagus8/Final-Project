"use client";

import { FieldArray, getIn, type FormikProps } from "formik";
import type { RegistrationValues } from "./registration-schema";
import styles from "../Register.module.scss";

type ClinicFieldsProps = {
  formik: FormikProps<RegistrationValues>;
};

// რეგისტრაციის ფორმის ნაწილი კლინიკისთვის: კლინიკის მონაცემები,
// ანგარიში (ელფოსტა, პაროლი) და ექიმების სია.
// ველები და შეცდომები საერთო formik-იდან მოდის (register/page.tsx)
export default function ClinicFields({ formik }: ClinicFieldsProps) {
  return (
    <section className={styles.clinicSection}>
      <h3 className={styles.sectionTitle}>კლინიკის ინფორმაცია</h3>

      <div className={styles["input-field"]}>
        <label htmlFor="clinicName">კლინიკის სახელი</label>
        <input id="clinicName" type="text" {...formik.getFieldProps("clinicName")} />
        {formik.touched.clinicName && formik.errors.clinicName ? (
          <div className={styles["error-text"]}>{formik.errors.clinicName}</div>
        ) : null}
      </div>

      <div className={styles["input-field"]}>
        <label htmlFor="city">ქალაქი</label>
        <input id="city" type="text" {...formik.getFieldProps("city")} />
        {formik.touched.city && formik.errors.city ? (
          <div className={styles["error-text"]}>{formik.errors.city}</div>
        ) : null}
      </div>

      <div className={styles["input-field"]}>
        <label htmlFor="address">კლინიკის მისამართი</label>
        <input id="address" type="text" {...formik.getFieldProps("address")} />
        {formik.touched.address && formik.errors.address ? (
          <div className={styles["error-text"]}>{formik.errors.address}</div>
        ) : null}
      </div>

      <div className={styles["input-field"]}>
        <label htmlFor="clinicPhone">კლინიკის ტელეფონი</label>
        <input id="clinicPhone" type="text" {...formik.getFieldProps("phone")} />
        {formik.touched.phone && formik.errors.phone ? (
          <div className={styles["error-text"]}>{formik.errors.phone}</div>
        ) : null}
      </div>

      <div className={styles["input-field"]}>
        <label htmlFor="specialty">კლინიკის პროფილი / სპეციალიზაცია</label>
        <input id="specialty" type="text" {...formik.getFieldProps("specialty")} />
        {formik.touched.specialty && formik.errors.specialty ? (
          <div className={styles["error-text"]}>{formik.errors.specialty}</div>
        ) : null}
      </div>

      <div className={styles["input-field"]}>
        <label htmlFor="imageUrl">პროფილის სურათის ბმული (არასავალდებულო)</label>
        <input id="imageUrl" type="url" {...formik.getFieldProps("imageUrl")} />
      </div>

      <h3 className={styles.sectionTitle}>კლინიკის ანგარიშის მონაცემები</h3>

      <div className={styles["input-field"]}>
        <label htmlFor="clinicEmail">კლინიკის ელ.ფოსტა</label>
        <input id="clinicEmail" type="email" {...formik.getFieldProps("email")} />
        {formik.touched.email && formik.errors.email ? (
          <div className={styles["error-text"]}>{formik.errors.email}</div>
        ) : null}
      </div>

      <div className={styles["input-field"]}>
        <label htmlFor="clinicPassword">პაროლი</label>
        <input id="clinicPassword" type="password" {...formik.getFieldProps("password")} />
        {formik.touched.password && formik.errors.password ? (
          <div className={styles["error-text"]}>{formik.errors.password}</div>
        ) : null}
      </div>

      <h3 className={styles.sectionTitle}>კლინიკის ექიმები</h3>

      {/* ექიმების დინამიკური სია: push ამატებს, remove შლის */}
      <FieldArray name="doctors">
        {({ push, remove }) => (
          <div className={styles.doctorList}>
            {formik.values.doctors.map((_, index) => (
              <fieldset key={index} className={styles.doctorCard}>
                <legend className={styles.doctorLegend}>ექიმი {index + 1}</legend>

                <div className={styles["input-field"]}>
                  <label htmlFor={`doctor-${index}-name`}>ექიმის სახელი და გვარი</label>
                  <input
                    id={`doctor-${index}-name`}
                    type="text"
                    {...formik.getFieldProps(`doctors.${index}.name`)}
                  />
                  {/* getIn ჩადგმულ შეცდომას პოულობს, მაგ: doctors.0.name */}
                  {getIn(formik.errors, `doctors.${index}.name`) ? (
                    <div className={styles["error-text"]}>
                      {getIn(formik.errors, `doctors.${index}.name`)}
                    </div>
                  ) : null}
                </div>

                <div className={styles["input-field"]}>
                  <label htmlFor={`doctor-${index}-specialty`}>სპეციალიზაცია</label>
                  <input
                    id={`doctor-${index}-specialty`}
                    type="text"
                    {...formik.getFieldProps(`doctors.${index}.specialty`)}
                  />
                  {getIn(formik.errors, `doctors.${index}.specialty`) ? (
                    <div className={styles["error-text"]}>
                      {getIn(formik.errors, `doctors.${index}.specialty`)}
                    </div>
                  ) : null}
                </div>

                <div className={styles["input-field"]}>
                  <label htmlFor={`doctor-${index}-experience`}>
                    გამოცდილება — წელი
                  </label>
                  <input
                    id={`doctor-${index}-experience`}
                    type="number"
                    min="0"
                    step="1"
                    {...formik.getFieldProps(
                      `doctors.${index}.experienceYears`,
                    )}
                  />
                  {getIn(formik.errors, `doctors.${index}.experienceYears`) ? (
                    <div className={styles["error-text"]}>
                      {getIn(formik.errors, `doctors.${index}.experienceYears`)}
                    </div>
                  ) : null}
                </div>

                {/* მინიმუმ ერთი ექიმი უნდა დარჩეს */}
                {formik.values.doctors.length > 1 && (
                  <button
                    type="button"
                    className={styles.doctorRemoveButton}
                    onClick={() => remove(index)}
                  >
                    ექიმის წაშლა
                  </button>
                )}
              </fieldset>
            ))}

            <button
              type="button"
              className={styles.addDoctorButton}
              onClick={() =>
                push({ name: "", specialty: "", experienceYears: 0 })
              }
            >
              ექიმის დამატება
            </button>
          </div>
        )}
      </FieldArray>
    </section>
  );
}
