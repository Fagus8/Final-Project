type DoctorAvatarProps = {
  name: string;
  avatarUrl: string | null;
  className?: string;
  // სურათის აღწერა; ცარიელია, როცა სახელი გვერდზე ისედაც წერია
  alt?: string;
};

// ექიმის ფოტო. თუ ფოტო არ აქვს, ვაჩვენებთ სახელის პირველ ასოს
export default function DoctorAvatar({ name, avatarUrl, className, alt = "" }: DoctorAvatarProps) {
  if (avatarUrl) {
    // ჩვეულებრივი <img>: ფოტო data URL-ია ან ნებისმიერი საიტის ბმული
    // eslint-disable-next-line @next/next/no-img-element
    return <img className={className} src={avatarUrl} alt={alt} />;
  }

  return (
    <span className={className} aria-hidden="true">
      {name.trim().charAt(0).toLocaleUpperCase("ka-GE")}
    </span>
  );
}
