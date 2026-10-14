// ვიზიტის ხანგრძლივობა წუთებში
export const SLOT_MINUTES = 30;

// საქართველოში ზაფხულის დრო აღარ გადადის, ამიტომ ყოველთვის UTC+4 გვაქვს.
// ბაზაში დრო ინახება UTC-ში, ეკრანზე კი ყოველთვის თბილისის დროით ვაჩვენებთ.
const TBILISI_OFFSET = "+04:00";
export const TIME_ZONE = "Asia/Tbilisi";

// "10:00" -> 600 წუთი
function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// 600 -> "10:00"
function toTimeString(totalMinutes: number) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// ექიმის სამუშაო საათებიდან ვაგენერირებთ ყველა სლოტს
export function generateTimes(workStart: string, workEnd: string) {
  const times: string[] = [];
  const end = toMinutes(workEnd);

  for (let minute = toMinutes(workStart); minute + SLOT_MINUTES <= end; minute += SLOT_MINUTES) {
    times.push(toTimeString(minute));
  }

  return times;
}

// "2026-10-15" + "10:30" -> Date (თბილისის დროით)
export function toDate(date: string, time: string) {
  return new Date(`${date}T${time}:00${TBILISI_OFFSET}`);
}

// Date -> "10:30" თბილისის დროით
export function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Date -> "2026-10-15" თბილისის დროით
export function formatDay(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

// Date -> "15.10.2026 10:30"
export function formatDateTime(date: Date) {
  const [year, month, day] = formatDay(date).split("-");
  return `${day}.${month}.${year} ${formatTime(date)}`;
}

export function isValidTime(time: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export function isValidDay(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(toDate(date, "00:00").getTime());
}

// კვირა დასვენების დღეა
export function isSunday(date: string) {
  return toDate(date, "12:00").getUTCDay() === 0;
}

export const statusLabels: Record<string, string> = {
  BOOKED: "დაჯავშნილი",
  COMPLETED: "დასრულებული",
  CANCELLED: "გაუქმებული",
};
