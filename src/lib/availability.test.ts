// getAvailableTimes-ის ტესტები: რომელი დროები ჩანს თავისუფლად.
// ბაზა ჩანაცვლებულია (mock), საათი კი დაფიქსირებულია (fake timers)
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAvailableTimes } from "./availability";
import { toDate } from "./time";

// ბაზის ნაცვლად — vi.mock ფაილის თავში აიწევა, ამიტომ vi.hoisted გვჭირდება
const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("./prisma", () => ({ prisma: { appointment: { findMany } } }));

const doctor = {
  id: "doctor-1",
  workStart: "10:00",
  workEnd: "12:00",
  workDays: [1, 2, 3, 4, 5, 6],
  daysOff: ["2026-10-16"],
};

describe("getAvailableTimes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // ოთხშაბათი, 14 ოქტომბერი, 12:00 თბილისის დროით
    vi.setSystemTime(new Date("2026-10-14T08:00:00Z"));
    findMany.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("დაკავებულ დროს აღარ აბრუნებს", async () => {
    findMany.mockResolvedValue([{ startsAt: toDate("2026-10-15", "10:30") }]);

    expect(await getAvailableTimes(doctor, "2026-10-15")).toEqual(["10:00", "11:00", "11:30"]);
  });

  it("გაუქმებული ვიზიტი დროს არ იკავებს", async () => {
    findMany.mockResolvedValue([]);
    await getAvailableTimes(doctor, "2026-10-15");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { not: "CANCELLED" } }),
      }),
    );
  });

  it("წარსულ დროს არ აბრუნებს", async () => {
    findMany.mockResolvedValue([]);
    vi.setSystemTime(toDate("2026-10-15", "11:10"));

    expect(await getAvailableTimes(doctor, "2026-10-15")).toEqual(["11:30"]);
  });

  it("კვირას სლოტები არ არის", async () => {
    expect(await getAvailableTimes(doctor, "2026-10-18")).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("ექიმის დასვენების დღეს სლოტები არ არის", async () => {
    expect(await getAvailableTimes(doctor, "2026-10-16")).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("პაციენტის სხვა ვიზიტების დროებსაც ითვალისწინებს", async () => {
    findMany.mockResolvedValue([]);
    await getAvailableTimes(doctor, "2026-10-15", "patient-1");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: [{ doctorId: "doctor-1" }, { patientId: "patient-1" }] }),
      }),
    );
  });
});
