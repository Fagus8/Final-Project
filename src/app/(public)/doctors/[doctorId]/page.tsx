import Link from "next/link";
import { notFound } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
import Icon from "@/components/ui/Icon";
import { isUuid } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import styles from "./DoctorProfile.module.scss";

// ექიმის საჯარო პროფილი: ფოტო, სპეციალობა, ბიოგრაფია, განათლება, ენები,
// სერვისები, ფასი, კლინიკა და იმავე კლინიკის სხვა ექიმები
export default async function DoctorProfilePage(props: PageProps<"/doctors/[doctorId]">) {
  const { doctorId } = await props.params;

  // არასწორი id-ით ბაზა შეცდომას აგდებს, ამიტომ წინასწარ ვამოწმებთ
  if (!isUuid(doctorId)) {
    notFound();
  }

  // დაუდასტურებელი ექიმის ან დაუმტკიცებელი კლინიკის პროფილი არ ჩანს (404)
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, isApproved: true, clinic: { isApproved: true } },
    include: {
      clinic: true,
      _count: { select: { appointments: { where: { status: "COMPLETED" } } } },
    },
  });

  if (!doctor) {
    notFound();
  }

  // იმავე კლინიკის სხვა ექიმები
  const colleagues = await prisma.doctor.findMany({
    where: { clinicId: doctor.clinicId, isApproved: true, id: { not: doctor.id } },
    orderBy: { name: "asc" },
    take: 6,
  });

  const session = await getSession();
  // „დაჯავშნა“ ღილაკი ჩანს სტუმრისთვის და პაციენტისთვის
  const canBook = !session || session.user.accountType === "PATIENT";

  return (
    <div className={styles.page}>
      <Sidebar />
      <main className={styles.main}>
        <Link href="/doctors" className={styles.backLink}>
          ← ყველა ექიმი
        </Link>

        <section className={styles.header}>
          <DoctorAvatar
            name={doctor.name}
            avatarUrl={doctor.avatarUrl}
            className={styles.avatar}
            alt={doctor.name}
          />

          <div className={styles.headerBody}>
            <h1>{doctor.name}</h1>
            <span className={styles.specialty}>{doctor.specialty}</span>
            <Link href={`/clinics/${doctor.clinic.id}`} className={styles.clinicLink}>
              <Icon name="clinic" size={16} />
              {doctor.clinic.name}
            </Link>
          </div>

          {canBook && (
            <Link className={styles.bookLink} href={`/booking?doctorId=${doctor.id}`}>
              <Icon name="calendarPlus" size={18} />
              ვიზიტის დაჯავშნა
            </Link>
          )}
        </section>

        <ul className={styles.stats}>
          <li>
            <strong>{doctor.experienceYears} წელი</strong>
            <span>გამოცდილება</span>
          </li>
          <li>
            <strong>{doctor._count.appointments}</strong>
            <span>ჩატარებული ვიზიტი</span>
          </li>
          <li>
            <strong>
              {doctor.workStart} – {doctor.workEnd}
            </strong>
            <span>მიღების საათები</span>
          </li>
          {doctor.consultationFee !== null && (
            <li>
              <strong>{doctor.consultationFee} ₾</strong>
              <span>კონსულტაციის ფასი</span>
            </li>
          )}
        </ul>

        {doctor.bio && (
          <section className={`${styles.panel} ${styles.about}`}>
            <h2>ექიმის შესახებ</h2>
            <p>{doctor.bio}</p>
          </section>
        )}

        <div className={styles.columns}>
          <section className={styles.panel}>
            <h2>ინფორმაცია</h2>
            <dl className={styles.info}>
              <div>
                <dt>
                  <Icon name="stethoscope" size={18} />
                  სპეციალობა
                </dt>
                <dd>{doctor.specialty}</dd>
              </div>
              {doctor.education && (
                <div>
                  <dt>
                    <Icon name="education" size={18} />
                    განათლება
                  </dt>
                  <dd>{doctor.education}</dd>
                </div>
              )}
              {doctor.languages.length > 0 && (
                <div>
                  <dt>
                    <Icon name="language" size={18} />
                    ენები
                  </dt>
                  <dd>{doctor.languages.join(", ")}</dd>
                </div>
              )}
              <div>
                <dt>
                  <Icon name="appointments" size={18} />
                  სამუშაო დღეები
                </dt>
                <dd>ორშაბათი – შაბათი</dd>
              </div>
              <div>
                <dt>
                  <Icon name="clock" size={18} />
                  მიღების საათები
                </dt>
                <dd>
                  {doctor.workStart} – {doctor.workEnd}
                </dd>
              </div>
              {doctor.room && (
                <div>
                  <dt>
                    <Icon name="door" size={18} />
                    კაბინეტი
                  </dt>
                  <dd>{doctor.room}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className={styles.panel}>
            <h2>კლინიკა</h2>
            <dl className={styles.info}>
              <div>
                <dt>
                  <Icon name="clinic" size={18} />
                  დასახელება
                </dt>
                <dd>
                  <Link href={`/clinics/${doctor.clinic.id}`}>{doctor.clinic.name}</Link>
                </dd>
              </div>
              <div>
                <dt>
                  <Icon name="pin" size={18} />
                  მისამართი
                </dt>
                <dd>
                  {doctor.clinic.city}, {doctor.clinic.address}
                </dd>
              </div>
              <div>
                <dt>
                  <Icon name="phone" size={18} />
                  ტელეფონი
                </dt>
                <dd>
                  <a href={`tel:${doctor.clinic.phone.replace(/\s/g, "")}`}>{doctor.clinic.phone}</a>
                </dd>
              </div>
            </dl>
          </section>
        </div>

        {doctor.services.length > 0 && (
          <section className={styles.section}>
            <h2>სერვისები</h2>
            <ul className={styles.services}>
              {doctor.services.map((service) => (
                <li key={service}>
                  <Icon name="check" size={16} />
                  {service}
                </li>
              ))}
            </ul>
          </section>
        )}

        {colleagues.length > 0 && (
          <section className={styles.section}>
            <h2>სხვა ექიმები ამ კლინიკაში</h2>
            <ul className={styles.colleagues}>
              {colleagues.map((colleague) => (
                <li key={colleague.id}>
                  <Link href={`/doctors/${colleague.id}`} className={styles.colleague}>
                    <DoctorAvatar
                      name={colleague.name}
                      avatarUrl={colleague.avatarUrl}
                      className={styles.smallAvatar}
                    />
                    <div>
                      <h3>{colleague.name}</h3>
                      <p>{colleague.specialty}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
