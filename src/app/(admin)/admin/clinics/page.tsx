import { redirect } from "next/navigation";
import DeleteClinicButton from "@/components/clinics/DeleteClinicButton";
import Sidebar from "@/components/layout/Sidebar";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import ApproveClinicButton from "./_components/ApproveClinicButton";
import EditClinicForm from "./_components/EditClinicForm";
import styles from "./AdminClinics.module.scss";

// ადმინის გვერდი: ყველა კლინიკა, მათი დამტკიცება, რედაქტირება და წაშლა
export default async function AdminClinicsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // გვერდი მხოლოდ ადმინისთვისაა
  if (session.user.role !== "admin") {
    redirect("/");
  }

  // ყველა კლინიკა (დაუმტკიცებელიც) თავისი ექიმებით
  const clinics = await prisma.clinic.findMany({
    include: { doctors: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>კლინიკების მართვა</h1>

        {clinics.length === 0 ? (
          <p className={styles.empty}>კლინიკები ჯერ არ არის რეგისტრირებული.</p>
        ) : (
          <div className={styles.list}>
            {clinics.map((clinic) => (
              <article className={styles.clinic} key={clinic.id}>
                <div className={styles.details}>
                  <h2>{clinic.name}</h2>
                  <p className={clinic.isApproved ? styles.approved : styles.pending}>
                    {clinic.isApproved ? "დამტკიცებულია" : "დასამტკიცებელია"}
                  </p>
                  <p>{clinic.city} · {clinic.address}</p>
                  <p>{clinic.phone} · {clinic.specialty}</p>

                  <h3>ექიმები ({clinic.doctors.length})</h3>
                  {clinic.doctors.length > 0 ? (
                    <ul>
                      {clinic.doctors.map((doctor) => (
                        <li key={doctor.id}>
                          {doctor.name} — {doctor.specialty}, {doctor.experienceYears} წელი
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>კლინიკას ექიმები არ დაუმატებია.</p>
                  )}
                </div>

                {/* მოქმედებები: დამტკიცება (თუ ჯერ არ არის), რედაქტირება, წაშლა */}
                <div className={styles.actions}>
                  {!clinic.isApproved && <ApproveClinicButton clinicId={clinic.id} />}
                  <EditClinicForm
                    clinic={{
                      id: clinic.id,
                      name: clinic.name,
                      city: clinic.city,
                      address: clinic.address,
                      phone: clinic.phone,
                      specialty: clinic.specialty,
                      imageUrl: clinic.imageUrl,
                      doctors: clinic.doctors.map((doctor) => ({
                        id: doctor.id,
                        name: doctor.name,
                        specialty: doctor.specialty,
                        experienceYears: doctor.experienceYears,
                      })),
                    }}
                  />
                  <DeleteClinicButton clinicId={clinic.id} clinicName={clinic.name} />
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
