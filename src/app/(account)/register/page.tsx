"use client";

import { FormikProvider, setIn, useFormik } from "formik";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import styles from "./register.module.scss";
import ClinicFields from "./_components/ClinicFields";
import PatientFields from "./_components/PatientFields";
import {
  registerSchema,
  type RegistrationValues,
} from "./_components/registration-schema";

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

        router.push("/");
      } catch {
        setStatus("სერვერთან დაკავშირება ვერ მოხერხდა. სცადე ხელახლა.");
      }
    },
  });

  return (
    <div className={styles["form-wrapper"]}>
      <h2>რეგისტრაცია </h2>

      <FormikProvider value={formik}>
        <form onSubmit={formik.handleSubmit}>
          <div className={styles["input-field"]}>
            <label htmlFor="accountType">ანგარიშის ტიპი</label>
            <select id="accountType" {...formik.getFieldProps("accountType")}>
              <option value="PATIENT">მომხმარებელი</option>
              <option value="CLINIC">კლინიკა</option>
            </select>
          </div>

          {formik.values.accountType === "PATIENT" ? (
            <PatientFields formik={formik} />
          ) : (
            <ClinicFields formik={formik} />
          )}
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
    </div>
  );
}
