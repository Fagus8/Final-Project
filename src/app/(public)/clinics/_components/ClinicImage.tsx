type ClinicImageProps = {
  src: string;
  alt: string;
  className?: string;
  // ეკრანის ზედა ნაწილში მყოფი სურათი (კლინიკის გვერდის hero) მაშინვე იტვირთება
  eager?: boolean;
};

// კლინიკის სურათი. ჩვეულებრივი <img>, რადგან ბმული ნებისმიერი საიტიდან
// შეიძლება იყოს და next/image-ს წინასწარ ცნობილი დომენები სჭირდება. srcset აქ
// შეუძლებელია (ბმული ერთი ზომისაა) — ზომას CSS ზღუდავს (object-fit), ჩატვირთვა ზარმაცია
export default function ClinicImage({ src, alt, className, eager = false }: ClinicImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" />
  );
}
