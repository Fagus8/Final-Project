// შესვლის შემდეგ დაბრუნება იმ გვერდზე, საიდანაც მომხმარებელი მოვიდა.
// მისამართი ?next= პარამეტრით გადაეცემა: /login?next=/booking?doctorId=...

// შესვლის გვერდის ბმული, რომელიც მითითებულ გვერდზე დააბრუნებს
export function loginUrl(next: string) {
  return `/login?next=${encodeURIComponent(next)}`;
}

// მხოლოდ ამავე საიტის გვერდი („//evil.com“ სხვა საიტზე წაიყვანდა)
export function safeNext(value: string | null | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}
