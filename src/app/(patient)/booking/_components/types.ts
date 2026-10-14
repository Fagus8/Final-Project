export type DoctorOption = {
  id: string;
  name: string;
  specialty: string;
  experienceYears: number;
  room: string | null;
  clinicName: string;
  avatarUrl?: string | null;
};

export type DoctorCardProps = {
  doctor: DoctorOption;
  selected: boolean;
  onSelect: (doctorId: string) => void;
};

export type BookingFormProps = {
  doctor: DoctorOption;
  selectedDate: string;
  availableTimes: readonly string[];
  selectedTime: string | null;
  isLoadingTimes: boolean;
  isSubmitting: boolean;
  onDateChange: (date: string) => void;
  onTimeSelect: (time: string) => void;
  onConfirm: () => void;
};
