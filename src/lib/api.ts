import { z } from "zod";
import { prisma } from "@/lib/prisma";

// API route-ების საერთო პატარა ფუნქციები

// შეცდომის პასუხი ერთნაირ ფორმატში: { message: "..." }
export function jsonError(message: string, status: number) {
  return Response.json({ message }, { status });
}

// მოთხოვნის JSON ტანი. თუ JSON გაფუჭებულია, ვაბრუნებთ null-ს —
// შემდეგ Zod-ის შემოწმება მას ჩააგდებს და 400 დაბრუნდება
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// ბაზაში ყველა id არის UUID. არასწორი id-ით Postgres შეცდომას აგდებს,
// ამიტომ ბაზამდე ვამოწმებთ
export function isUuid(value: string) {
  return z.string().uuid().safeParse(value).success;
}

// კლინიკის დამატებული ექიმის ელფოსტა სავალდებულოა: ამით ექიმის ანგარიში
// დადასტურებისას სწორ ჩანაწერს მიებმება და დუბლიკატი არ იქმნება
export const doctorEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("ექიმის ელფოსტა სავალდებულოა და სწორი ფორმატის უნდა იყოს");

// ამოწმებს ექიმების ელფოსტებს: სიაში არ უნდა მეორდებოდეს და სხვა ექიმს
// არ უნდა ჰქონდეს. აბრუნებს შეცდომის პასუხს ან null-ს
export async function checkDoctorEmails(emails: string[], exceptDoctorIds: string[] = []) {
  const repeated = emails.find((email, index) => emails.indexOf(email) !== index);
  if (repeated) {
    return jsonError(`ელფოსტა ${repeated} ორ ექიმზეა მითითებული`, 400);
  }

  const taken = await prisma.doctor.findFirst({
    where: { email: { in: emails }, id: { notIn: exceptDoctorIds } },
    select: { email: true },
  });

  return taken ? jsonError(`ელფოსტა ${taken.email} სხვა ექიმს უკვე აქვს`, 409) : null;
}
