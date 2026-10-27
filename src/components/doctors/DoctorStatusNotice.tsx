import Link from "next/link";

type DoctorStatusNoticeProps = {
  // ექიმის ჩანაწერი კლინიკის სახელით; null — ანგარიში ჯერ არცერთ კლინიკას არ უკავშირდება
  doctor: {
    isApproved: boolean;
    rejectedAt: Date | null;
    removedAt: Date | null;
    clinic: { name: string };
  } | null;
  // „ჩემ განრიგზე“ კლინიკის არჩევის ფორმა თვითონ ჩანს, ბმული არ სჭირდება
  showLink?: boolean;
};

// ექიმის მდგომარეობა, სანამ კლინიკა არ დაადასტურებს: არ არის დაკავშირებული,
// მოთხოვნა უარყვეს, კლინიკიდან მოხსნეს ან დადასტურებას ელოდება.
// გამოიყენება კაბინეტში, „ჩემ განრიგსა“ და „ჩემ პროფილზე“
export default function DoctorStatusNotice({ doctor, showLink = true }: DoctorStatusNoticeProps) {
  const chooseLink = showLink && <> <Link href="/doctor-schedule">აირჩიე კლინიკა →</Link></>;

  if (!doctor) {
    return <>შენი ანგარიში ჯერ არცერთ კლინიკას არ უკავშირდება.{chooseLink}</>;
  }

  if (doctor.removedAt) {
    return (
      <>
        კლინიკამ <strong>{doctor.clinic.name}</strong> შეწყვიტა თანამშრომლობა — შენი მომავალი
        ვიზიტები გაუქმდა. შეგიძლია სხვა კლინიკა აირჩიო.{chooseLink}
      </>
    );
  }

  if (doctor.rejectedAt) {
    return (
      <>
        კლინიკამ <strong>{doctor.clinic.name}</strong> უარყო შენი მოთხოვნა. შეგიძლია სხვა კლინიკა
        აირჩიო.{chooseLink}
      </>
    );
  }

  return (
    <>
      შენი მოთხოვნა გაგზავნილია კლინიკაში <strong>{doctor.clinic.name}</strong> და დადასტურებას
      ელოდება. დადასტურების შემდეგ გამოჩნდება შენი განრიგი, პაციენტები და პროფილის რედაქტირება.
    </>
  );
}
