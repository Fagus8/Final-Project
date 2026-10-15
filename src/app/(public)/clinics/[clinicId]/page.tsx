import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { z } from "zod";
import Sidebar from "@/components/layout/Sidebar";
import Icon from "@/components/ui/Icon";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClinicImage from "../_components/ClinicImage";
import styles from "./ClinicDetails.module.scss";

export default async function ClinicDetailsPage(props: PageProps<"/clinics/[clinicId]">) {
  const { clinicId } = await props.params;

  // არასწორი id-ით ბაზა შეცდომას აგდებს, ამიტომ წინასწარ ვამოწმებთ
  if (!z.string().uuid().safeParse(clinicId).success) {
    notFound();
  }

  const clinic = await prisma.clinic.findFirst({
    where: { id: clinicId, isApproved: true },
    include: {
      doctors: {
        where: { isApproved: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!clinic) {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  // „დაჯავშნა“ ღილაკი ჩანს სტუმრისთვის და პაციენტისთვის
  const canBook = !session || session.user.accountType === "PATIENT";

  const specialties = [...new Set(clinic.doctors.map((doctor) => doctor.specialty))].sort();
  const totalExperience = clinic.doctors.reduce((sum, doctor) => sum + doctor.experienceYears, 0);
  const averageExperience = clinic.doctors.length
    ? Math.round(totalExperience / clinic.doctors.length)
    : 0;

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <Link href="/clinics" className={styles.backLink}>
          ← ყველა კლინიკა
        </Link>

        <section className={styles.hero}>
          {clinic.imageUrl ? (
            <ClinicImage className={styles.heroImage} src={clinic.imageUrl} alt={clinic.name} />
          ) : (
            <div className={styles.heroPlaceholder} aria-hidden="true">
              <Icon name="clinic" size={56} />
            </div>
          )}

          <div className={styles.heroBody}>
            <span className={styles.specialty}>{clinic.specialty}</span>
            <h1>{clinic.name}</h1>

            <ul className={styles.contacts}>
              <li>
                <Icon name="pin" size={18} />
                {clinic.city}, {clinic.address}
              </li>
              <li>
                <Icon name="phone" size={18} />
                <a href={`tel:${clinic.phone.replace(/\s/g, "")}`}>{clinic.phone}</a>
              </li>
              <li>
                <Icon name="clock" size={18} />
                ორშაბათი – შაბათი
              </li>
            </ul>

            <div className={styles.actions}>
              {canBook && clinic.doctors.length > 0 && (
                <Link className={styles.primaryLink} href={`/booking?clinicId=${clinic.id}`}>
                  <Icon name="calendarPlus" size={18} />
                  ვიზიტის დაჯავშნა
                </Link>
              )}
              <a
                className={styles.secondaryLink}
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${clinic.name}, ${clinic.address}, ${clinic.city}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="pin" size={18} />
                რუკაზე ნახვა
              </a>
            </div>
          </div>
        </section>

        <ul className={styles.stats}>
          <li>
            <strong>{clinic.doctors.length}</strong>
            <span>ექიმი</span>
          </li>
          <li>
            <strong>{specialties.length}</strong>
            <span>სპეციალობა</span>
          </li>
          <li>
            <strong>{averageExperience} წელი</strong>
            <span>საშუალო გამოცდილება</span>
          </li>
        </ul>

        {specialties.length > 0 && (
          <section className={styles.section}>
            <h2>სპეციალობები</h2>
            <ul className={styles.tags}>
              {specialties.map((specialty) => (
                <li key={specialty}>{specialty}</li>
              ))}
            </ul>
          </section>
        )}

        <section className={styles.section}>
          <h2>კლინიკის ექიმები</h2>
          {clinic.doctors.length === 0 ? (
            <p className={styles.empty}>ამ კლინიკაში ჯერ ექიმები არ არიან დამატებული.</p>
          ) : (
            <ul className={styles.doctors}>
              {clinic.doctors.map((doctor) => (
                <li key={doctor.id}>
                  <Link href={`/doctors/${doctor.id}`} className={styles.doctor}>
                    {doctor.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className={styles.avatar} src={doctor.avatarUrl} alt="" />
                    ) : (
                      <span className={styles.avatar} aria-hidden="true">
                        {doctor.name.trim().charAt(0).toLocaleUpperCase("ka-GE")}
                      </span>
                    )}
                    <div>
                      <h3>{doctor.name}</h3>
                      <p>{doctor.specialty}</p>
                      <span>გამოცდილება: {doctor.experienceYears} წელი</span>
                    </div>
                    <Icon name="arrowRight" size={18} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
