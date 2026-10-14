"use client";

import { FormikProvider, setIn, useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/Icon";
import { authClient } from "@/lib/auth-client";
import styles from "./Register.module.scss";
import ClinicFields from "./_components/ClinicFields";
import DoctorFields from "./_components/DoctorFields";
import PersonalFields from "./_components/PersonalFields";
import {
  registerSchema,
  type RegistrationValues,
} from "./_components/registration-schema";

const accountTypes: { value: RegistrationValues["accountType"]; label: string; icon: IconName }[] = [
  { value: "PATIENT", label: "პაციენტი", icon: "profile" },
  { value: "DOCTOR", label: "ექიმი", icon: "stethoscope" },
  { value: "CLINIC", label: "კლინიკა", icon: "clinic" },
];

export default function RegisterPage() {
  const router = useRouter();

  const formik = useFormik<RegistrationValues>({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      phone: "",
      accountType: "PATIENT",
      clinicName: "",
      city: "",
      address: "",
      specialty: "",
      imageUrl: "",
      doctorSpecialty: "",
      doctorExperience: 0,
      doctorClinicId: "",
      doctors: [{ name: "", specialty: "", experienceYears: 0 }],
    },
    validate: (values) => {
      const result = registerSchema.safeParse(values);

      if (result.success) {
        return {};
      }

      let errors = {};

      result.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        if (path) {
          errors = setIn(errors, path, issue.message);
        }
      });

      return errors;
    },

    onSubmit: async (values, { setStatus }) => {
      try {
        const email = values.email.trim();
        let canResumeClinicRegistration = false;

        if (values.accountType === "CLINIC") {
          const { data: session } = await authClient.getSession();

          if (session) {
            canResumeClinicRegistration =
              session.user.email.toLowerCase() === email.toLowerCase() &&
              session.user.accountType === "CLINIC";

            if (!canResumeClinicRegistration) {
              setStatus(
                "კლინიკის რეგისტრაციის გასაგრძელებლად შესაბამის ანგარიშში შედი.",
              );
              return;
            }
          }
        }

        if (!canResumeClinicRegistration) {
          const { error } = await authClient.signUp.email({
            name:
              values.accountType === "CLINIC"
                ? values.clinicName.trim()
                : values.fullName.trim(),
            email,
            password: values.password,
            accountType: values.accountType,
          });

          if (error) {
            setStatus(error.message);
            return;
          }
        }

        if (values.accountType === "CLINIC") {
          const response = await fetch("/api/clinic-registration", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: values.clinicName,
              city: values.city,
              address: values.address,
              phone: values.phone,
              specialty: values.specialty,
              imageUrl: values.imageUrl,
              doctors: values.doctors,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            setStatus(
              result.message || "კლინიკის მონაცემების შენახვა ვერ მოხერხდა",
            );
            return;
          }
        }

        // ექიმის მონაცემები იგზავნება კლინიკასთან დასადასტურებლად
        if (values.accountType === "DOCTOR") {
          const response = await fetch("/api/doctor-registration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              specialty: values.doctorSpecialty,
              experienceYears: values.doctorExperience,
              clinicId: values.doctorClinicId,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            setStatus(result.message || "ექიმის მონაცემების შენახვა ვერ მოხერხდა");
            return;
          }

          router.push("/my-schedule");
          router.refresh();
          return;
        }

        router.push("/");
      } catch {
        setStatus("სერვერთან დაკავშირება ვერ მოხერხდა. სცადე ხელახლა.");
      }
    },
  });

  return (
    <main className={styles.page}>
      <div className={styles["form-wrapper"]}>
        <span className={styles.logo} aria-hidden="true">
          <Icon name="logo" size={22} />
        </span>
        <h2>შექმენი ანგარიში</h2>
        <p className={styles.subtitle}>აირჩიე, ვინ ხარ — ფორმა შესაბამისად შეიცვლება</p>

        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit}>
            {/* ანგარიშის ტიპი — სამი ბარათი ჩამოსაშლელი სიის ნაცვლად */}
            <fieldset className={styles.typePicker}>
              <legend className={styles.visuallyHidden}>ანგარიშის ტიპი</legend>
              {accountTypes.map((type) => (
                <label
                  key={type.value}
                  className={`${styles.typeOption} ${
                    formik.values.accountType === type.value ? styles.typeSelected : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="accountType"
                    value={type.value}
                    checked={formik.values.accountType === type.value}
                    onChange={() => formik.setFieldValue("accountType", type.value)}
                  />
                  <Icon name={type.icon} size={22} />
                  <span>{type.label}</span>
                </label>
              ))}
            </fieldset>

            {formik.values.accountType === "CLINIC" ? (
              <ClinicFields formik={formik} />
            ) : (
              <PersonalFields formik={formik} />
            )}

            {formik.values.accountType === "DOCTOR" && <DoctorFields formik={formik} />}
            {formik.status && (
              <div className={styles["error-text"]} role="alert">
                {formik.status}
              </div>
            )}

            <button type="submit" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? "იგზავნება..." : "რეგისტრაცია"}
            </button>
          </form>
        </FormikProvider>

        <p className={styles.switch}>
          უკვე გაქვს ანგარიში? <Link href="/login">შესვლა</Link>
        </p>
      </div>
    </main>
  );
}
