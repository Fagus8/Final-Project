"use client";

import { FormikProvider, setIn, useFormik } from "formik";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon, { type IconName } from "@/components/ui/Icon";
import { authClient } from "@/lib/auth-client";
import { sendRequest } from "@/lib/api-client";
import { safeNext } from "@/lib/next-url";
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

// ქმნის ანგარიშს better-auth-ით. აბრუნებს შეცდომის ტექსტს ან null-ს
async function createAccount(values: RegistrationValues) {
  const email = values.email.trim();

  // თუ ანგარიში უკვე შეიქმნა, მაგრამ დამატებითი მონაცემები ვერ შეინახა (მაგ: ინტერნეტი
  // გაითიშა), იმავე ანგარიშით ხელახლა გაგზავნა შეიძლება — ანგარიშს თავიდან აღარ ვქმნით
  const { data: session } = await authClient.getSession();

  if (session) {
    const isSameAccount =
      session.user.email.toLowerCase() === email.toLowerCase() &&
      session.user.accountType === values.accountType;

    return isSameAccount ? null : "რეგისტრაციის გასაგრძელებლად შესაბამის ანგარიშში შედი.";
  }

  const { error } = await authClient.signUp.email({
    // კლინიკის ანგარიშის სახელი კლინიკის სახელია
    name: values.accountType === "CLINIC" ? values.clinicName.trim() : values.fullName.trim(),
    email,
    password: values.password,
    accountType: values.accountType,
  });

  return error ? (error.message ?? "რეგისტრაცია ვერ მოხერხდა") : null;
}

// ინახავს როლის მიხედვით დამატებით მონაცემებს:
// პაციენტი → ტელეფონი და სისხლის ჯგუფი, კლინიკა → კლინიკის მონაცემები,
// ექიმი → მოთხოვნა არჩეულ კლინიკას (თუ აირჩია)
async function saveRoleDetails(values: RegistrationValues) {
  if (values.accountType === "CLINIC") {
    return sendRequest("/api/clinic-registration", "POST", {
      name: values.clinicName,
      city: values.city,
      address: values.address,
      phone: values.phone,
      specialty: values.specialty,
      imageUrl: values.imageUrl,
    });
  }

  if (values.accountType === "PATIENT") {
    return sendRequest("/api/patient-registration", "POST", {
      phone: values.phone,
      bloodType: values.bloodType,
    });
  }

  if (values.doctorClinicId) {
    return sendRequest("/api/doctor-registration", "POST", {
      specialty: values.doctorSpecialty,
      experienceYears: values.doctorExperience,
      clinicIds: [values.doctorClinicId],
    });
  }

  return { ok: true, message: "" };
}

// სად გადავიდეს მომხმარებელი რეგისტრაციის შემდეგ
function destination(values: RegistrationValues) {
  if (values.accountType === "DOCTOR") {
    // კლინიკა თუ ჯერ არ აურჩევია, „ჩემ პროფილში“ ფორმა შეყვანილი მონაცემებით ივსება
    if (values.doctorClinicId) {
      return "/doctor-profile";
    }
    const params = new URLSearchParams({
      specialty: values.doctorSpecialty.trim(),
      experience: String(values.doctorExperience),
    });
    return `/doctor-profile?${params}`;
  }

  // პაციენტი ბრუნდება იქ, საიდანაც რეგისტრაციაზე მოვიდა (მაგ: ჯავშანი).
  // კლინიკა კაბინეტში ნახავს, რომ დამტკიცებას ელოდება
  const next = safeNext(new URLSearchParams(window.location.search).get("next"));
  return (values.accountType === "PATIENT" && next) || "/dashboard";
}

// რეგისტრაციის გვერდი. ჯერ იქმნება ანგარიში (better-auth), შემდეგ
// როლის მიხედვით იგზავნება დამატებითი მონაცემები
export default function RegisterPage() {
  const router = useRouter();

  const formik = useFormik<RegistrationValues>({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      passwordRepeat: "",
      phone: "",
      bloodType: "",
      accountType: "PATIENT",
      clinicName: "",
      city: "",
      address: "",
      specialty: "",
      imageUrl: "",
      doctorSpecialty: "",
      doctorExperience: 0,
      doctorClinicId: "",
    },
    // Zod-ის შეცდომებს formik-ის ფორმატში გადავიყვანთ (ველის სახელი → ტექსტი)
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
        // ნაბიჯი 1: ანგარიშის შექმნა
        const accountError = await createAccount(values);
        if (accountError) {
          setStatus(accountError);
          return;
        }

        // ნაბიჯი 2: როლის დამატებითი მონაცემები
        const result = await saveRoleDetails(values);
        if (!result.ok) {
          setStatus(result.message);
          return;
        }

        // ნაბიჯი 3: გადასვლა. refresh საჭიროა, რომ Header-მა და Sidebar-მა ახალი სესია დაინახონ
        router.push(destination(values));
        router.refresh();
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
        <h2>შექმენი ანგარიში medical.ge-ზე</h2>
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
