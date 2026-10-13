type ClinicImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export default function ClinicImage({ src, alt, className }: ClinicImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={src} alt={alt} />
  );
}
