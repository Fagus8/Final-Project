import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, statusLabels } from "@/lib/slots";

// კლინიკის ვიზიტების ანგარიში CSV ფაილად (Excel-ში იხსნება)
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.accountType !== "CLINIC") {
    return Response.json({ message: "ანგარიში მხოლოდ კლინიკისთვისაა" }, { status: 403 });
  }

  const appointments = await prisma.appointment.findMany({
    where: { doctor: { clinicId: session.user.id } },
    include: { doctor: true, patient: true },
    orderBy: { startsAt: "asc" },
  });

  const rows = [
    ["თარიღი", "ექიმი", "სპეციალობა", "კაბინეტი", "პაციენტი", "სტატუსი"],
    ...appointments.map((appointment) => [
      formatDateTime(appointment.startsAt),
      appointment.doctor.name,
      appointment.doctor.specialty,
      appointment.doctor.room ?? "",
      appointment.patient.name,
      statusLabels[appointment.status] ?? appointment.status,
    ]),
  ];

  // ბრჭყალებში ვსვამთ, რომ მძიმე ტექსტში არ აირიოს
  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n");

  // ﻿ საჭიროა, რომ Excel-მა ქართული ასოები სწორად აჩვენოს
  return new Response("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="report.csv"',
    },
  });
}
