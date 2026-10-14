import Sidebar from "@/components/layout/Sidebar";
import Card from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";
import ClinicImage from "./_components/ClinicImage";
import styles from "./Clinics.module.scss";

export default async function ClinicsPage() {
  const clinics = await prisma.clinic.findMany({
    where: { isApproved: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>კლინიკები</h1>
        <div className={styles.clinicCards}>
          {clinics.map((clinic) => (
            <Card key={clinic.id} className={styles.clinicCard}>
              {clinic.imageUrl && (
                <ClinicImage
                  className={styles.clinicImage}
                  src={clinic.imageUrl}
                  alt={clinic.name}
                />
              )}
              <h2>{clinic.name}</h2>
              <p>{clinic.city}</p>
              <p>{clinic.address}</p>
              <p>{clinic.phone}</p>
              <p>{clinic.specialty}</p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
