type ClinicsImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export const clinicsImages: Record<string, { src: string; alt: string }> = {
  clinic_1: {
    src: 'https://www.newhospitals.ge/res/upload/d98c8414f8041caab811515b6173d234.jpg',
    alt: 'ნიუ ჰოსპიტალსის შენობის გარე ხედი, თბილისი',
  },
  clinic_2: {
    src: 'https://gh.ge/app/uploads/2022/09/DJI_0592.00_01_14_17.Still003_205.jpg',
    alt: 'ჯეო ჰოსპიტალსის შენობის გარე ხედი, თბილისი',
  },
  clinic_3: {
    src: 'https://commons.wikimedia.org/wiki/Special:FilePath/%E1%83%97%E1%83%91%E1%83%98%E1%83%9A%E1%83%98%E1%83%A1%E1%83%98_-_%E1%83%A9%E1%83%90%E1%83%A9%E1%83%90%E1%83%95%E1%83%90%E1%83%A1_%E1%83%99%E1%83%9A%E1%83%98%E1%83%9C%E1%83%98%E1%83%99%E1%83%90_0580.jpg?width=900',
    alt: 'ჩაჩავას კლინიკის შენობის გარე ხედი, თბილისი',
  },
};

export default function ClinicsImage({ src, alt, className }: ClinicsImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={className} src={src} alt={alt} />
  );
}
