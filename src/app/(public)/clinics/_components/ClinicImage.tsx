type ClinicImageProps = {
  src: string;
  alt: string;
  className?: string;
};

// კლინიკის სურათი. ჩვეულებრივი <img>, რადგან ბმული ნებისმიერი საიტიდან
// შეიძლება იყოს და next/image-ს წინასწარ ცნობილი დომენები სჭირდება
export default function ClinicImage({ src, alt, className }: ClinicImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={src} alt={alt} />
  );
}
