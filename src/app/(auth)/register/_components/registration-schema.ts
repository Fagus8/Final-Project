import { z } from "zod";

// რეგისტრაციის ფორმის ვალიდაცია (Zod). ფორმა სამივე როლისთვის ერთია,
// ამიტომ ველები აქ არასავალდებულოა, ხოლო რომელი ველი რომელ როლს სჭირდება,
// ქვემოთ superRefine ამოწმებს
export const registerSchema = z
  .object({
    fullName: z.string(),
    email: z.string().email("არავალიდური ელ.ფოსტის ფორმატი"),
    password: z.string().min(6, "პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო"),
    phone: z.string(),
    // მხოლოდ პაციენტისთვის; "" — ჯერ არ ვიცი
    bloodType: z.string(),
    accountType: z.enum(["PATIENT", "CLINIC", "DOCTOR"]),
    clinicName: z.string(),
    city: z.string(),
    address: z.string(),
    specialty: z.string(),
    imageUrl: z.string(),
    // მხოლოდ ექიმის რეგისტრაციისთვის
    doctorSpecialty: z.string(),
    doctorExperience: z.number().int().min(0, "გამოცდილების წელი უნდა იყოს 0 ან მეტი"),
    doctors: z.array(
      z.object({
        name: z.string(),
        specialty: z.string(),
        experienceYears: z
          .number()
          .int()
          .min(0, "გამოცდილების წელი უნდა იყოს 0 ან მეტი"),
        // ამ ელფოსტით დარეგისტრირებული ექიმი ამ ჩანაწერს მიებმება
        email: z.string(),
      }),
    ),
  })
  .superRefine((values, context) => {
    // დამხმარე: ცარიელ ველზე შეცდომას ამატებს მითითებულ ადგილას (path)
    const requireText = (
      value: string,
      path: (string | number)[],
      message: string,
    ) => {
      if (!value.trim()) {
        context.addIssue({ code: "custom", path, message });
      }
    };

    if (values.accountType === "PATIENT" || values.accountType === "DOCTOR") {
      requireText(values.fullName, ["fullName"], "სახელი და გვარი სავალდებულოა");
      requireText(values.phone, ["phone"], "ტელეფონის ნომერი სავალდებულოა");
    }

    // ექიმი რეგისტრაციისას კლინიკას არ ირჩევს: მოწვეულის მოთხოვნა ავტომატურად
    // მომწვევ კლინიკას ეგზავნება, დანარჩენი კლინიკას „ჩემ განრიგში“ ირჩევს
    if (values.accountType === "DOCTOR") {
      requireText(values.doctorSpecialty, ["doctorSpecialty"], "სპეციალობა სავალდებულოა");
    }

    // დანარჩენი შემოწმებები მხოლოდ კლინიკისთვისაა
    if (values.accountType !== "CLINIC") {
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

    const doctorEmails = values.doctors.map((doctor) => doctor.email.trim().toLowerCase());

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

      const email = doctorEmails[index];
      if (!z.string().email().safeParse(email).success) {
        context.addIssue({
          code: "custom",
          path: ["doctors", index, "email"],
          message: "ექიმის ელ.ფოსტა სავალდებულოა",
        });
      } else if (doctorEmails.indexOf(email) !== index) {
        context.addIssue({
          code: "custom",
          path: ["doctors", index, "email"],
          message: "ეს ელ.ფოსტა სხვა ექიმზეა მითითებული",
        });
      }
    });
  });

// ფორმის მნიშვნელობების ტიპი პირდაპირ სქემიდან გამოიყვანება
export type RegistrationValues = z.infer<typeof registerSchema>;
