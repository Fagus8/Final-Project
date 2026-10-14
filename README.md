# სამედიცინო პლატფორმა

Next.js-ზე დაფუძნებული აპლიკაცია კლინიკების, ექიმებისა და პაციენტების
ინფორმაციის სანახავად და სამართავად. მომხმარებლის ავტორიზაციისთვის გამოიყენება
Better Auth, ხოლო მონაცემთა ბაზასთან სამუშაოდ — PostgreSQL და Prisma.

## საჭირო პროგრამები

- Node.js და npm
- PostgreSQL მონაცემთა ბაზა

## პროექტის გაშვება

1. დააყენე პროექტის დამოკიდებულებები:

   ```bash
   npm install
   ```

2. პროექტის მთავარ საქაღალდეში შექმენი `.env` ან `.env.local` ფაილი და მიუთითე
   PostgreSQL მონაცემთა ბაზასთან კავშირის მისამართი:

   ```env
   DATABASE_URL="postgresql://მომხმარებელი:პაროლი@სერვერი:5432/მონაცემთა_ბაზა?schema=public"
   ```

   ჩაანაცვლე მაგალითის მნიშვნელობები შენი მონაცემთა ბაზის შესაბამისი
   მნიშვნელობებით. გარემოს ცვლადების ფაილი არ ატვირთო Git-ში და არ გაუზიარო
   სხვებს.

3. შექმენი მონაცემთა ბაზის ცხრილები მიგრაციების მიხედვით:

   ```bash
   npx prisma migrate dev
   ```

4. გაუშვი განვითარების სერვერი:

   ```bash
   npm run dev
   ```

5. გახსენი [http://localhost:3000](http://localhost:3000).

## ბრძანებები

| ბრძანება | დანიშნულება |
| --- | --- |
| `npm run dev` | განვითარების სერვერის გაშვება |
| `npm run lint` | ESLint-ით კოდის შემოწმება |
| `npm run build` | წარმოებისთვის პროექტის აწყობა |
| `npm run start` | უკვე აწყობილი პროექტის გაშვება |
| `npx prisma migrate dev` | მონაცემთა ბაზის მიგრაციების გამოყენება |
| `npx prisma generate` | Prisma Client-ის გენერირება |

## გვერდები

| მისამართი | დანიშნულება |
| --- | --- |
| `/` | მთავარი გვერდი |
| `/login`, `/register` | შესვლა და რეგისტრაცია (პაციენტი, კლინიკა, ექიმი) |
| `/dashboard` | პირადი კაბინეტი |
| `/profile` | პაციენტის პროფილი |
| `/notifications` | შეტყობინებები |
| `/clinics` | დამტკიცებული კლინიკების სია |
| `/doctors` | ექიმების სია |
| `/booking` | ექიმის ძებნა და ვიზიტის დაჯავშნა (პაციენტი) |
| `/my-appointments` | ჩემი ვიზიტები, დიაგნოზები და რეცეპტები (პაციენტი) |
| `/my-schedule` | ექიმის განრიგი და დიაგნოზის ჩაწერა (ექიმი) |
| `/my-clinic` | კლინიკის მართვა: ექიმები, კაბინეტები, ვიზიტები, ანგარიში (კლინიკა) |
| `/admin/clinics` | კლინიკების დამტკიცება (ადმინისტრატორი) |
| `/admin/patients` | პაციენტების სია (ადმინისტრატორი) |
| `/docs` | API დოკუმენტაცია |

## პროექტის სტრუქტურა

```text
prisma/
  migrations/                 მონაცემთა ბაზის მიგრაციები
  schema.prisma               მონაცემთა ბაზის სქემა
src/
  app/                        მხოლოდ გვერდები (route-ები) და API
    layout.tsx                საერთო განლაგება: <html>, შრიფტები, Header (Next.js-ის სავალდებულო ფაილი)
    page.tsx                  მთავარი გვერდი „/“ — მხოლოდ აბრუნებს components/home/HomePage-ს
    (auth)/                   login, register (+ რეგისტრაციის ფორმები და ვალიდაცია)
    (account)/                dashboard, profile, notifications
      Account.module.scss     ამ ჯგუფის გვერდების საერთო სტილი
    (public)/                 clinics, doctors — ყველასთვის ღია გვერდები
    (patient)/                booking, my-appointments — პაციენტის გვერდები
      Patient.module.scss     ამ ჯგუფის გვერდების საერთო სტილი
    (staff)/                  my-schedule (ექიმი), my-clinic (კლინიკა)
      Staff.module.scss       ამ ჯგუფის გვერდების საერთო სტილი
    (admin)/                  admin/clinics, admin/patients — ადმინისტრატორი
    (docs)/                   docs — Swagger API დოკუმენტაცია
    api/                      API route-ები (auth, appointments, doctors, clinics ...)
  components/                 კომპონენტები (გვერდების „აგურები“)
    home/                     მთავარი გვერდი: HomePage, Hero, BookingSteps, FeaturedDoctors, JoinBanner
    layout/                   Header, Sidebar, NavLink, LogoutButton — ყველა გვერდის ჩარჩო
    appointments/             ვიზიტის მოქმედებები (გაუქმება, დიაგნოზი) და ვიზიტების სიის სტილი
    doctors/                  DoctorScheduleForm — ექიმის საათები, კაბინეტი, ელფოსტა
    ui/                       საერთო ელემენტები: Icon, Card, Calendar
  lib/                        სერვერის ლოგიკა და დამხმარე ფუნქციები
    prisma.ts, auth.ts        ბაზასთან და ავტორიზაციასთან კავშირი
    auth-client.ts            ავტორიზაცია ბრაუზერში
    slots.ts                  დროის სლოტები და თბილისის დროის ზონა
    appointments.ts           თავისუფალი დროების გამოთვლა
    notifications.ts          შეტყობინებების შექმნა
  styles/                     გლობალური სტილი, ფერები (_colors) და მიქსინები (_shared)
  generated/prisma/           Prisma Client (ავტომატურად გენერირდება, არ შეცვალო)
```

**წესები, რომლითაც ფაილები ლაგდება:**

- ფრჩხილებში მოქცეული საქაღალდეები (`(auth)`, `(patient)` ...) Next.js-ის
  route group-ებია: კოდს როლების მიხედვით აჯგუფებს, მაგრამ URL-ში არ ჩანს.
  მაგალითად, `src/app/(patient)/appointments/` კვლავ `/appointments` მისამართია.
- `src/app/`-ში მხოლოდ Next.js-ის ფაილებია (`page.tsx`, `layout.tsx`, `route.ts`).
  დიდი გვერდის შიგთავსი `src/components/`-ში გადადის, მაგალითად მთავარი გვერდი —
  `components/home/`-ში.
- კომპონენტი, რომელიც მხოლოდ ერთ გვერდზე გამოიყენება, ინახება ამ გვერდის
  `_components/` საქაღალდეში. რამდენიმე გვერდზე გამოყენებული კომპონენტი კი
  `src/components/`-შია.
- კომპონენტის სტილი მის გვერდით დევს და იგივე სახელი აქვს
  (`Calendar.tsx` → `Calendar.module.scss`). კომპონენტის ფაილები PascalCase-ით
  იწერება, დამხმარე ფაილები (`lib/`, სქემები) kebab-case-ით.
