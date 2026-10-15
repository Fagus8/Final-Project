// ჯავშნის გვერდის კომპონენტების საერთო ტიპები

// ექიმი, როგორც ჯავშნის სიაში ჩანს
export type DoctorOption = {
  id: string;
  name: string;
  specialty: string;
  experienceYears: number;
  room: string | null;
  clinicName: string;
  avatarUrl?: string | null;
  consultationFee: number | null;
  languages: string[];
};

export type DoctorCardProps = {
  doctor: DoctorOption;
  selected: boolean;
  onSelect: (doctorId: string) => void;
};

export type BookingFormProps = {
  doctor: DoctorOption;
  // "2026-10-15" ფორმატით
  selectedDate: string;
  availableTimes: readonly string[];
  // "10:30" ან null, თუ დრო ჯერ არ აურჩევია
  selectedTime: string | null;
  isLoadingTimes: boolean;
  isSubmitting: boolean;
  onDateChange: (date: string) => void;
  onTimeSelect: (time: string) => void;
  onConfirm: () => void;
};
