import { z } from "zod";

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
