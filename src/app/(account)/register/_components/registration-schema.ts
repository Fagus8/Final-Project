import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string(),
    email: z.string().email("არავალიდური ელ.ფოსტის ფორმატი"),
    password: z.string().min(6, "პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო"),
    phone: z.string(),
    accountType: z.enum(["PATIENT", "CLINIC"]),
    clinicName: z.string(),
    city: z.string(),
    address: z.string(),
    specialty: z.string(),
    imageUrl: z.string(),
    doctors: z.array(
      z.object({
        name: z.string(),
        specialty: z.string(),
        experienceYears: z
          .number()
          .int()
          .min(0, "გამოცდილების წელი უნდა იყოს 0 ან მეტი"),
      }),
    ),
  })
  .superRefine((values, context) => {
    const requireText = (
      value: string,
      path: (string | number)[],
      message: string,
    ) => {
      if (!value.trim()) {
        context.addIssue({ code: "custom", path, message });
      }
    };

    if (values.accountType === "PATIENT") {
      requireText(values.fullName, ["fullName"], "სახელი და გვარი სავალდებულოა");
      requireText(values.phone, ["phone"], "ტელეფონის ნომერი სავალდებულოა");
      return;
    }

    requireText(values.clinicName, ["clinicName"], "კლინიკის სახელი სავალდებულოა");
    requireText(values.city, ["city"], "ქალაქი სავალდებულოა");
    requireText(values.address, ["address"], "მისამართი სავალდებულოა");
    requireText(values.phone, ["phone"], "კლინიკის ტელეფონი სავალდებულოა");
    requireText(values.specialty, ["specialty"], "სპეციალიზაცია სავალდებულოა");

    if (values.doctors.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["doctors"],
        message: "დაამატე მინიმუმ ერთი ექიმი",
      });
    }

    values.doctors.forEach((doctor, index) => {
      requireText(
        doctor.name,
        ["doctors", index, "name"],
        "ექიმის სახელი სავალდებულოა",
      );
      requireText(
        doctor.specialty,
        ["doctors", index, "specialty"],
        "სპეციალიზაცია სავალდებულოა",
      );
    });
  });

export type RegistrationValues = z.infer<typeof registerSchema>;
export type AccountType = RegistrationValues["accountType"];
