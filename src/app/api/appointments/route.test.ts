// ჯავშნის API-ის (POST /api/appointments) ტესტები: წარმატებული ჯავშანი,
// ორმაგი ჯავშანი, არასწორი დრო და უფლებები
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toDate } from "@/lib/time";
import { POST } from "./route";

// ავტორიზაცია და ბაზა ჩანაცვლებულია, რომ ტესტი ბაზის გარეშე გაეშვას
const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  findDoctor: vi.fn(),
  findAppointment: vi.fn(),
  createAppointment: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.getSession } } }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    doctor: { findFirst: mocks.findDoctor },
    $transaction: mocks.transaction,
  },
}));

const DOCTOR_ID = "6f1c2c8e-8a4b-4c55-9a3e-2b1d7c9e0f11";
const patientSession = { user: { id: "patient-1", name: "ანა", accountType: "PATIENT" } };
const doctor = {
  id: DOCTOR_ID,
  name: "ნინო ბერიძე",
  workStart: "10:00",
  workEnd: "18:00",
  clinicId: "clinic-1",
  userId: "doctor-user-1",
};

function book(body: unknown) {
  return POST(
    new Request("http://localhost/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/appointments", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // ოთხშაბათი, 14 ოქტომბერი, 12:00 თბილისის დროით
    vi.setSystemTime(new Date("2026-10-14T08:00:00Z"));
    Object.values(mocks).forEach((mock) => mock.mockReset());

    mocks.getSession.mockResolvedValue(patientSession);
    mocks.findDoctor.mockResolvedValue(doctor);
    mocks.findAppointment.mockResolvedValue(null);
    mocks.createAppointment.mockResolvedValue({ id: "appointment-1" });
    // ტრანზაქცია callback-ს იმავე „ბაზით“ უშვებს
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        appointment: { findFirst: mocks.findAppointment, create: mocks.createAppointment },
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("თავისუფალ დროს ჯავშნის", async () => {
    const response = await book({ doctorId: DOCTOR_ID, date: "2026-10-15", time: "10:30" });

    expect(response.status).toBe(200);
    expect(mocks.createAppointment).toHaveBeenCalledWith({
      data: { doctorId: DOCTOR_ID, patientId: "patient-1", startsAt: toDate("2026-10-15", "10:30") },
    });
  });

  it("ორმაგი ჯავშანი: ექიმი ამ დროს უკვე დაკავებულია → 409", async () => {
    mocks.findAppointment.mockResolvedValueOnce({ id: "existing" });

    const response = await book({ doctorId: DOCTOR_ID, date: "2026-10-15", time: "10:30" });

    expect(response.status).toBe(409);
    expect(mocks.createAppointment).not.toHaveBeenCalled();
  });

  it("ორმაგი ჯავშანი: პაციენტს ამ დროს სხვა ვიზიტი აქვს → 409", async () => {
    mocks.findAppointment.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "other-doctor" });

    const response = await book({ doctorId: DOCTOR_ID, date: "2026-10-15", time: "10:30" });

    expect(response.status).toBe(409);
    expect(mocks.createAppointment).not.toHaveBeenCalled();
  });

  it("ერთდროული ჯავშნისას ჩავარდნილი ტრანზაქცია → 409", async () => {
    mocks.transaction.mockRejectedValueOnce(new Error("could not serialize access"));

    const response = await book({ doctorId: DOCTOR_ID, date: "2026-10-15", time: "10:30" });

    expect(response.status).toBe(409);
  });

  it.each([
    ["კვირა", "2026-10-18", "10:30"],
    ["სამუშაო საათების გარეთ", "2026-10-15", "09:00"],
    ["სლოტის ბადის გარეთ", "2026-10-15", "10:15"],
    ["წარსული დრო", "2026-10-14", "11:00"],
  ])("%s → 400", async (_label, date, time) => {
    const response = await book({ doctorId: DOCTOR_ID, date, time });

    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("შესვლის გარეშე → 401", async () => {
    mocks.getSession.mockResolvedValue(null);

    expect((await book({ doctorId: DOCTOR_ID, date: "2026-10-15", time: "10:30" })).status).toBe(401);
  });

  it("ექიმი ან კლინიკა ვერ ჯავშნის → 403", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "x", name: "x", accountType: "DOCTOR" } });

    expect((await book({ doctorId: DOCTOR_ID, date: "2026-10-15", time: "10:30" })).status).toBe(403);
  });
});
