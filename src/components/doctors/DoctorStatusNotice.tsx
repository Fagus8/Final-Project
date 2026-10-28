import Link from "next/link";

type DoctorStatusNoticeProps = {
  // ექიმის კავშირები კლინიკებთან; ცარიელი — ანგარიში ჯერ არცერთ კლინიკას არ უკავშირდება
  clinics: {
    isApproved: boolean;
    rejectedAt: Date | null;
    removedAt: Date | null;
    clinic: { name: string };
  }[];
  // „ჩემ პროფილში“ კლინიკის არჩევის ფორმა თვითონ ჩანს, ბმული არ სჭირდება
  showLink?: boolean;
};

// კლინიკების სახელები ერთ სტრიქონად: „ა“, „ბ“ და „გ“
function names(clinics: DoctorStatusNoticeProps["clinics"]) {
  return clinics.map((item, index) => (
    <span key={item.clinic.name}>
      {index > 0 && (index === clinics.length - 1 ? " და " : ", ")}
      <strong>{item.clinic.name}</strong>
    </span>
  ));
}

// ექიმის მდგომარეობა, სანამ ერთი კლინიკა მაინც არ დაადასტურებს: არ არის დაკავშირებული,
// მოთხოვნები ელოდება, უარყვეს ან კლინიკიდან მოხსნეს.
// გამოიყენება კაბინეტში და „ჩემ პროფილში“
export default function DoctorStatusNotice({ clinics, showLink = true }: DoctorStatusNoticeProps) {
  const chooseLink = showLink && <> <Link href="/doctor-profile">აირჩიე კლინიკა →</Link></>;

  if (clinics.length === 0) {
    return <>შენი ანგარიში ჯერ არცერთ კლინიკას არ უკავშირდება.{chooseLink}</>;
  }

  const pending = clinics.filter((item) => !item.isApproved && !item.rejectedAt && !item.removedAt);
  const rejected = clinics.filter((item) => item.rejectedAt);
  const removed = clinics.filter((item) => item.removedAt);

  return (
    <>
      {pending.length > 0 && (
        <>
          შენი მოთხოვნა გაგზავნილია {pending.length > 1 ? "კლინიკებში" : "კლინიკაში"} {names(pending)} და
          დადასტურებას ელოდება. ერთი კლინიკის დადასტურების შემდეგ გამოჩნდება შენი განრიგი,
          პაციენტები და პროფილის რედაქტირება.{" "}
        </>
      )}
      {rejected.length > 0 && <>{names(rejected)} — მოთხოვნა უარყოფილია. </>}
      {removed.length > 0 && <>{names(removed)} — თანამშრომლობა შეწყდა, მომავალი ვიზიტები გაუქმდა. </>}
      {pending.length === 0 && <>შეგიძლია სხვა კლინიკა აირჩიო.{chooseLink}</>}
    </>
  );
}
