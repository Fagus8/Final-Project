// ვიზიტის სტატუსის ქართული სახელები
export const statusLabels: Record<string, string> = {
  BOOKED: "დაჯავშნილი",
  COMPLETED: "დასრულებული",
  CANCELLED: "გაუქმებული",
  // დაჯავშნილი ვიზიტი, რომლის დროც გავიდა, ექიმს კი დიაგნოზი ჯერ არ ჩაუწერია
  PAST: "დიაგნოზის მოლოდინში",
};

// ვინ გააუქმა ვიზიტი
export const cancelledByLabels: Record<string, string> = {
  PATIENT: "პაციენტმა",
  DOCTOR: "ექიმმა",
  CLINIC: "კლინიკამ",
  ADMIN: "ადმინისტრატორმა",
};

// ეკრანზე საჩვენებელი სტატუსი: გასული დაჯავშნილი ვიზიტი ცალკე ჩანს
export function displayStatus(status: string, startsAt: Date, now = new Date()) {
  return status === "BOOKED" && startsAt < now ? "PAST" : status;
}

// "გააუქმა კლინიკამ: ექიმი შვებულებაშია"
export function cancellationText(cancelledBy: string | null, cancelReason: string | null) {
  const who = cancelledBy ? `გააუქმა ${cancelledByLabels[cancelledBy] ?? ""}` : "გაუქმდა";
  return cancelReason ? `${who}: ${cancelReason}` : who;
}
