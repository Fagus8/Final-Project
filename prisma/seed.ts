// სადემონსტრაციო მონაცემები: კლინიკები, ექიმები, პაციენტები და ვიზიტები.
// გაშვება: npx prisma db seed
// არსებულ მონაცემებს არ ეხება; თუ demo ანგარიშები უკვე არსებობს, არაფერს აკეთებს.
import "dotenv/config";
import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";
import { formatDay, isSunday, toDate } from "../src/lib/time";
import { faker } from "@faker-js/faker";
const PASSWORD = "demo1234";
const ADMIN_EMAIL = "l.metreveli88@gmail.com";

async function createUser(name: string, email: string, accountType: "PATIENT" | "CLINIC" | "DOCTOR") {
  const { user } = await auth.api.signUpEmail({
    body: { name, email, password: PASSWORD, accountType },
  });
  return user;
}

// დღიდან offset დღით დაშორებული სამუშაო დღე (კვირას ვტოვებთ)
function workday(offset: number, time: string) {
  const date = new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
  let day = formatDay(date);
  if (isSunday(day)) {
    day = formatDay(new Date(date.getTime() + (offset < 0 ? -1 : 1) * 24 * 60 * 60 * 1000));
  }
  return toDate(day, time);
}

const clinics = [
  {
    name: "თბილისის სამედიცინო ცენტრი",
    email: "clinic.tbilisi@medical.ge",
    city: "თბილისი",
    address: "ჭავჭავაძის გამზ. 33",
    phone: "+995 32 200 10 10",
    specialty: "მრავალპროფილური",
    doctors: [
      { name: "ნინო ბერიძე", specialty: "კარდიოლოგი", experienceYears: 12, room: "204", email: "nino.beridze@medical.ge" },
      { name: "გიორგი ლომიძე", specialty: "თერაპევტი", experienceYears: 8, room: "105", email: "giorgi.lomidze@medical.ge" },
      { name: "მარიამ კაპანაძე", specialty: "პედიატრი", experienceYears: 15, room: "301", email: "mariam.kapanadze@medical.ge" },
    ],
  },
  {
    name: "ბათუმის კლინიკა",
    email: "clinic.batumi@medical.ge",
    city: "ბათუმი",
    address: "რუსთაველის ქ. 12",
    phone: "+995 422 27 00 00",
    specialty: "ოჯახის მედიცინა",
    doctors: [
      { name: "ლევან ჯაფარიძე", specialty: "ნევროლოგი", experienceYears: 10, room: "12", email: "levan.japaridze@medical.ge" },
      { name: "თამარ ხარაძე", specialty: "დერმატოლოგი", experienceYears: 6, room: "14", email: "tamar.kharadze@medical.ge" },
    ],
  },
];

const patients = [
  { name: "ანა გელაშვილი", email: "ana@medical.ge", phone: "+995 555 11 22 33", bloodType: "A(II)+" },
  { name: "დავით მაისურაძე", email: "davit@medical.ge", phone: "+995 577 44 55 66", bloodType: null },
  { name: "ელენე წიკლაური", email: "elene@medical.ge", phone: "+995 599 77 88 99", bloodType: "O(I)-" },
];

async function main() {
  if (await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })) {
    console.log("სადემონსტრაციო მონაცემები უკვე არსებობს — არაფერი შეიცვალა.");
    return;
  }

  const admin = await createUser("ადმინისტრატორი", ADMIN_EMAIL, "PATIENT");
  await prisma.user.update({ where: { id: admin.id }, data: { role: "admin" } });

  // კლინიკები და ექიმები. ყველა ექიმს საკუთარი ანგარიში აქვს (Doctor.userId სავალდებულოა)
  const doctorIds: string[] = [];
  for (const clinic of clinics) {
    const clinicUser = await createUser(clinic.name, clinic.email, "CLINIC");
    await prisma.clinic.create({
      data: {
        id: clinicUser.id,
        name: clinic.name,
        city: clinic.city,
        address: clinic.address,
        phone: clinic.phone,
        specialty: clinic.specialty,
        isApproved: true,
      },
    });

    for (const doctor of clinic.doctors) {
      const doctorUser = await createUser(doctor.name, doctor.email, "DOCTOR");
      const created = await prisma.doctor.create({
        data: {
          name: doctor.name,
          specialty: doctor.specialty,
          experienceYears: doctor.experienceYears,
          room: doctor.room,
          userId: doctorUser.id,
          isApproved: true,
          clinicId: clinicUser.id,
          languages: ["ქართული", "ინგლისური"],
          consultationFee: 50,
        },
      });
      doctorIds.push(created.id);
    }
  }

  const patientIds: string[] = [];
  for (const patient of patients) {
    const user = await createUser(patient.name, patient.email, "PATIENT");
    await prisma.patient.create({
      data: { id: user.id, phone: patient.phone, bloodType: patient.bloodType },
    });
    patientIds.push(user.id);
  }

  // ვიზიტები: წარსული (დასრულებული, დიაგნოზით), გაუქმებული და მომავალი
  const [ana, davit, elene] = patientIds;
  const [nino, giorgi, mariam, levan] = doctorIds;
  await prisma.appointment.createMany({
    data: [
     

        {
           doctorId: nino,
          patientId: ana,
          startsAt: workday(-14, "11:00"),
          status: "COMPLETED",
          diagnosis: "დიაგნოზი",
          prescription: faker.lorem.words(100), 
       },
      {
        doctorId: giorgi, patientId: davit, startsAt: workday(-7, "12:30"), status: "COMPLETED",
        diagnosis: "გაციება",
        prescription: "სიცხის დამწევი საჭიროების შემთხვევაში, ბევრი სითხე და დასვენება",
      },
      { doctorId: mariam, patientId: elene, startsAt: workday(-3, "10:00"), status: "CANCELLED" },
      { doctorId: nino, patientId: ana, startsAt: workday(2, "11:30"), status: "BOOKED" },
      { doctorId: levan, patientId: davit, startsAt: workday(3, "14:00"), status: "BOOKED" },
      { doctorId: giorgi, patientId: elene, startsAt: workday(5, "10:30"), status: "BOOKED" },
    ],
  });

  console.log("სადემონსტრაციო მონაცემები შეიქმნა. ყველა ანგარიშის პაროლი:", PASSWORD);
  console.log("ადმინი:", ADMIN_EMAIL);
  console.log("კლინიკები:", clinics.map((clinic) => clinic.email).join(", "));
  console.log("ექიმები:", clinics.flatMap((c) => c.doctors.map((d) => d.email)).join(", "));
  console.log("პაციენტები:", patients.map((patient) => patient.email).join(", "));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
