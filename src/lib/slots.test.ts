// slots.ts-ის ტესტები: დროის სლოტები, თბილისის დრო და ვალიდაცია.
// გაშვება: npm test
import { describe, expect, it } from "vitest";
import {
  formatDateTime,
  formatDay,
  formatTime,
  generateTimes,
  isSunday,
  isValidDay,
  isValidTime,
  toDate,
} from "./slots";

describe("generateTimes", () => {
  it("ყოფს სამუშაო საათებს 30-წუთიან სლოტებად", () => {
    expect(generateTimes("10:00", "12:00")).toEqual(["10:00", "10:30", "11:00", "11:30"]);
  });

  it("ბოლო სლოტი სამუშაოს დასრულებამდე უნდა მოთავსდეს", () => {
    expect(generateTimes("10:00", "11:15")).toEqual(["10:00", "10:30"]);
  });

  it("ცარიელია, თუ დრო ერთ სლოტსაც არ ჰყოფნის", () => {
    expect(generateTimes("10:00", "10:20")).toEqual([]);
  });
});

describe("თბილისის დრო (UTC+4)", () => {
  it("toDate თბილისის დროს UTC-ში გადაიყვანს", () => {
    expect(toDate("2026-10-15", "10:30").toISOString()).toBe("2026-10-15T06:30:00.000Z");
  });

  it("formatDay/formatTime თბილისის დროით აჩვენებს", () => {
    // UTC-ით ჯერ კიდევ 14 ოქტომბერია, თბილისში უკვე 15
    const date = new Date("2026-10-14T21:30:00Z");
    expect(formatDay(date)).toBe("2026-10-15");
    expect(formatTime(date)).toBe("01:30");
  });

  it("formatDateTime და toDate ერთმანეთს ემთხვევა", () => {
    expect(formatDateTime(toDate("2026-10-15", "09:00"))).toBe("15.10.2026 09:00");
  });
});

describe("ვალიდაცია", () => {
  it("isValidTime", () => {
    expect(isValidTime("09:30")).toBe(true);
    expect(isValidTime("23:59")).toBe(true);
    expect(isValidTime("24:00")).toBe(false);
    expect(isValidTime("9:30")).toBe(false);
    expect(isValidTime("10:60")).toBe(false);
  });

  it("isValidDay", () => {
    expect(isValidDay("2026-10-15")).toBe(true);
    expect(isValidDay("2026-13-01")).toBe(false);
    expect(isValidDay("15.10.2026")).toBe(false);
  });

  it("isSunday — კვირა დასვენების დღეა", () => {
    expect(isSunday("2026-10-18")).toBe(true);
    expect(isSunday("2026-10-19")).toBe(false);
  });
});
