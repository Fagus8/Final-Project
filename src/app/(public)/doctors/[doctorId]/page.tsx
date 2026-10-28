import Link from "next/link";
import { notFound } from "next/navigation";
import Sidebar from "@/components/navigation/Sidebar";
import DoctorAvatar from "@/components/ui/DoctorAvatar";
import Icon from "@/components/ui/Icon";
import { isUuid } from "@/lib/api";
import { visibleClinicWhere, visibleDoctorWhere } from "@/lib/doctors";
import { prisma } from "@/lib/prisma";
import { formatLongDay, formatDay, formatWorkDays } from "@/lib/time";
import { getSession } from "@/lib/session";
import styles from "./DoctorProfile.module.scss";

// ექიმის საჯარო პროფილი: ფოტო, სპეციალობა, ბიოგრაფია, განათლება, ენები,
// სერვისები, ფასი, კლინიკები (თითოში თავისი გრაფიკით) და იმავე კლინიკების სხვა ექიმები
export default async function DoctorProfilePage(props: PageProps<"/doctors/[doctorId]">) {
  const { doctorId } = await props.params;

  // არასწორი id-ით ბაზა შეცდომას აგდებს, ამიტომ წინასწარ ვამოწმებთ
  if (!isUuid(doctorId)) {
    notFound();
  }

  // დაუდასტურებელი/დაურეგისტრირებელი ექიმის ან დაუმტკიცებელი კლინიკის პროფილი არ ჩანს (404)
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, ...visibleDoctorWhere },
    include: {
      // მხოლოდ ხილული კლინიკები — თითოეულს თავისი გრაფიკი და კაბინეტი აქვს
      clinics: { where: visibleClinicWhere, include: { clinic: true }, orderBy: { clinic: { name: "asc" } } },
      _count: { select: { appointments: { where: { status: "COMPLETED" } } } },
    },
  });

  if (!doctor) {
    notFound();
  }

  // იმავე კლინიკების სხვა ექიმები
  const clinicIds = doctor.clinics.map((item) => item.clinicId);
  const colleagues = await prisma.doctor.findMany({
    where: {
      clinics: { some: { ...visibleClinicWhere, clinicId: { in: clinicIds } } },
      id: { not: doctor.id },
    },
    orderBy: { name: "asc" },
    take: 6,
  });

  const session = await getSession();
  // „დაჯავშნა“ ღილაკი ჩანს სტუმრისთვის და პაციენტისთვის
  const canBook = !session || session.user.accountType === "PATIENT";

  // უახლოესი (არაუმეტეს ხუთი) დასვენების დღე კლინიკაში
  const today = formatDay(new Date());
  const upcomingDaysOff = (daysOff: string[]) => daysOff.filter((day) => day >= today).slice(0, 5);

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
            {doctor.clinics.map(({ clinic }) => (
              <Link key={clinic.id} href={`/clinics/${clinic.id}`} className={styles.clinicLink}>
                <Icon name="clinic" size={16} />
                {clinic.name}
              </Link>
            ))}
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
            <strong>{doctor.clinics.length}</strong>
            <span>კლინიკა</span>
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
            </dl>
          </section>

          {/* თითო კლინიკა — მისამართი და ამ კლინიკაში მიღების გრაფიკი */}
          {doctor.clinics.map(({ clinic, ...schedule }) => {
            const daysOff = upcomingDaysOff(schedule.daysOff);
            return (
              <section key={clinic.id} className={styles.panel}>
                <h2>
                  <Link href={`/clinics/${clinic.id}`}>{clinic.name}</Link>
                </h2>
                <dl className={styles.info}>
                  <div>
                    <dt>
                      <Icon name="pin" size={18} />
                      მისამართი
                    </dt>
                    <dd>
                      {clinic.city}, {clinic.address}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Icon name="phone" size={18} />
                      ტელეფონი
                    </dt>
                    <dd>
                      <a href={`tel:${clinic.phone.replace(/\s/g, "")}`}>{clinic.phone}</a>
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Icon name="appointments" size={18} />
                      სამუშაო დღეები
                    </dt>
                    <dd>{formatWorkDays(schedule.workDays)}</dd>
                  </div>
                  {/* უახლოესი დასვენების დღეები, რომ პაციენტმა წინასწარ იცოდეს */}
                  {daysOff.length > 0 && (
                    <div>
                      <dt>
                        <Icon name="appointments" size={18} />
                        არ იღებს
                      </dt>
                      <dd>{daysOff.map((day) => formatLongDay(day)).join("; ")}</dd>
                    </div>
                  )}
                  <div>
                    <dt>
                      <Icon name="clock" size={18} />
                      მიღების საათები
                    </dt>
                    <dd>
                      {schedule.workStart} – {schedule.workEnd}
                    </dd>
                  </div>
                  {schedule.room && (
                    <div>
                      <dt>
                        <Icon name="door" size={18} />
                        კაბინეტი
                      </dt>
                      <dd>{schedule.room}</dd>
                    </div>
                  )}
                </dl>
                {canBook && doctor.clinics.length > 1 && (
                  <Link href={`/booking?doctorId=${doctor.id}&clinicId=${clinic.id}`}>
                    დაჯავშნა ამ კლინიკაში →
                  </Link>
                )}
              </section>
            );
          })}
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
            <h2>{doctor.clinics.length > 1 ? "სხვა ექიმები ამ კლინიკებში" : "სხვა ექიმები ამ კლინიკაში"}</h2>
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
