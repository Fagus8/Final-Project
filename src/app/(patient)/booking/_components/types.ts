// ექიმი, როგორც ჯავშნის სიაში ჩანს (გვერდი ბაზიდან ამ ფორმით გადასცემს)
export type DoctorOption = {
  id: string;
  name: string;
  specialty: string;
  experienceYears: number;
  room: string | null;
  clinicName: string;
  avatarUrl: string | null;
  consultationFee: number | null;
  languages: string[];
};
