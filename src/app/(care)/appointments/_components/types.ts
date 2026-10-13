export type DoctorOption = {
  id: string;
  name: string;
  specialty: string;
  experienceYears: number;
  clinicName: string;
  avatarUrl?: string | null;
};

export type DoctorOptionCardProps = {
  doctor: DoctorOption;
  selected: boolean;
  onSelect: (doctorId: string) => void;
};

export type AppointmentBookingFormProps = {
  doctor: DoctorOption;
  selectedDate: string;
  availableTimes: readonly string[];
  selectedTime: string | null;
  onDateChange: (date: string) => void;
  onTimeSelect: (time: string) => void;
  onConfirm: () => void;
};
