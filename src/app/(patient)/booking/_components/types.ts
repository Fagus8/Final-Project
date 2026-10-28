// ექიმი კონკრეტულ კლინიკაში, როგორც ჯავშნის სიაში ჩანს (გვერდი ბაზიდან ამ ფორმით გადასცემს).
// რამდენიმე კლინიკაში მომუშავე ექიმი სიაში თითო კლინიკისთვის ცალკე ჩანს
export type DoctorOption = {
  // ექიმის კავშირის (DoctorClinic) id — სიაში უნიკალურია
  id: string;
  doctorId: string;
  clinicId: string;
  name: string;
  specialty: string;
  experienceYears: number;
  room: string | null;
  clinicName: string;
  avatarUrl: string | null;
  consultationFee: number | null;
  languages: string[];
  // ამ კლინიკის სამუშაო დღეები (0 — კვირა) და დასვენების დღეები — კალენდარში ითიშება
  workDays: number[];
  daysOff: string[];
};
