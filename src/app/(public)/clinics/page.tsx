import Link from "next/link";
import Sidebar from "@/components/navigation/Sidebar";
import Card from "@/components/ui/Card";
import filters from "@/components/ui/Filters.module.scss";
import Icon from "@/components/ui/Icon";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import ClinicImage from "./_components/ClinicImage";
import styles from "./Clinics.module.scss";

// კლინიკების სია, ყველასთვის ღია. ძებნა სახელით და ქალაქით (?q=...&city=...).
// ბარათზე დაჭერით კლინიკის გვერდი იხსნება
export default async function ClinicsPage({ searchParams }: PageProps<"/clinics">) {
  const { q, city } = await searchParams;
  const search = typeof q === "string" ? q.trim() : "";
  const selectedCity = typeof city === "string" ? city : "";

  // მხოლოდ ადმინის მიერ დამტკიცებული კლინიკები
  const where: Prisma.ClinicWhereInput = { isApproved: true };
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (selectedCity) {
    where.city = selectedCity;
  }

  const [clinics, cities] = await Promise.all([
    prisma.clinic.findMany({ where, orderBy: { name: "asc" } }),
    // ფილტრის სია: ქალაქები, გამეორების გარეშე
    prisma.clinic.findMany({
      where: { isApproved: true },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
  ]);

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>კლინიკები</h1>

        <form className={filters.filters} action="/clinics">
          <input type="search" name="q" defaultValue={search} placeholder="კლინიკის სახელი" aria-label="კლინიკის სახელი" />
          <select name="city" defaultValue={selectedCity} aria-label="ქალაქი">
            <option value="">ყველა ქალაქი</option>
            {cities.map((item) => (
              <option key={item.city} value={item.city}>{item.city}</option>
            ))}
          </select>
          <button type="submit">ძებნა</button>
          {(search || selectedCity) && <Link href="/clinics">გასუფთავება</Link>}
        </form>

        {clinics.length === 0 ? (
          <p className={filters.empty}>
            {search || selectedCity ? "ამ ძებნით კლინიკა ვერ მოიძებნა." : "კლინიკები ჯერ არ არის დამატებული."}
          </p>
        ) : (
          <div className={styles.clinicCards}>
            {clinics.map((clinic) => (
              <Card key={clinic.id} className={styles.clinicCard}>
                <Link href={`/clinics/${clinic.id}`} className={styles.clinicLink}>
                  {/* სურათის გარეშე ბარათებიც ერთი სიმაღლისაა */}
                  {clinic.imageUrl ? (
                    <ClinicImage
                      className={styles.clinicImage}
                      src={clinic.imageUrl}
                      alt={clinic.name}
                    />
                  ) : (
                    <div className={styles.clinicPlaceholder} aria-hidden="true">
                      <Icon name="clinic" size={44} />
                    </div>
                  )}
                  <h2>{clinic.name}</h2>
                  <p>{clinic.city}</p>
                  <p>{clinic.address}</p>
                  <p>{clinic.phone}</p>
                  <p>{clinic.specialty}</p>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
