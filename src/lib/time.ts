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

// კვირის დღე: 0 — კვირა, 1 — ორშაბათი ... 6 — შაბათი
export function weekday(date: string) {
  return toDate(date, "12:00").getUTCDay();
}

type WorkSchedule = {
  workDays: number[];
  daysOff: string[];
};

// მუშაობს თუ არა ექიმი ამ დღეს: სამუშაო დღეა და დასვენების სიაში არ არის
export function isWorkingDay(schedule: WorkSchedule, date: string) {
  return schedule.workDays.includes(weekday(date)) && !schedule.daysOff.includes(date);
}

// კვირის დღეების სახელები, ინდექსი = weekday()
export const WEEKDAY_NAMES = ["კვირა", "ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი"];
// ფორმებში ორშაბათიდან ვიწყებთ
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

// [1,2,3,4,5,6] -> "ორშაბათი – შაბათი", [1,3,5] -> "ორშაბათი, ოთხშაბათი, პარასკევი"
export function formatWorkDays(workDays: number[]) {
  const days = WEEK_ORDER.filter((day) => workDays.includes(day));

  if (days.length === 0) {
    return "სამუშაო დღეები არ არის მითითებული";
  }

  // ზედიზედ დღეები (მინიმუმ სამი) შუალედით იწერება
  const positions = days.map((day) => WEEK_ORDER.indexOf(day));
  const isRange = positions.every((position, index) => index === 0 || position === positions[index - 1] + 1);

  if (isRange && days.length >= 3) {
    return `${WEEKDAY_NAMES[days[0]]} – ${WEEKDAY_NAMES[days[days.length - 1]]}`;
  }

  return days.map((day) => WEEKDAY_NAMES[day]).join(", ");
}

const MONTH_NAMES = [
  "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
  "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი",
];

// "2026-10-15" -> "15 ოქტომბერი 2026, ხუთშაბათი"
export function formatLongDay(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return `${day} ${MONTH_NAMES[month - 1]} ${year}, ${WEEKDAY_NAMES[weekday(date)]}`;
}

// დღევანდელი დღის დასაწყისი და ხვალინდელის დასაწყისი, თბილისის დროით.
// გამოიყენება „დღევანდელი ვიზიტების“ დასათვლელად
export function todayRange() {
  const todayStart = toDate(formatDay(new Date()), "00:00");
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  return { todayStart, tomorrowStart };
}
