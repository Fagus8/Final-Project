export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experienceYears: number;
  avatarUrl: string;
  isApproved: boolean;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  bloodType: string;
  lastVisit: string;
  avatarUrl: string;
}

export interface Clinic {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  specialty: string;
}

export const mockDoctors: Doctor[] = [
  {
    id: 'doc_1',
    name: 'დოქტორი გიორგი ბერიძე',
    specialty: 'კარდიოლოგი',
    rating: 4.9,
    experienceYears: 8,
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300',
    isApproved: true,
  },
  {
    id: 'doc_2',
    name: 'დოქტორი ნინო აბაშიძე',
    specialty: 'ნევროლოგი',
    rating: 4.8,
    experienceYears: 12,
    avatarUrl: 'https://images.unsplash.com/photo-1594824813566-888242274b8a?w=300',
    isApproved: false,
  },
];

export const mockPatients: Patient[] = [
  {
    id: 'pat_1',
    name: 'ლაშა მეტრეველი',
    age: 31,
    bloodType: 'A+',
    lastVisit: '2026-10-01',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
  },
];

export const mockClinics: Clinic[] = [
  {
    id: 'clinic_1',
    name: 'თბილისის ცენტრალური კლინიკა',
    city: 'თბილისი',
    address: 'ვაჟა-ფშაველას გამზირი 15',
    phone: '+995 32 200 10 10',
    specialty: 'მრავალპროფილური',
  },
  {
    id: 'clinic_2',
    name: 'მედიქალ ჰაუსი',
    city: 'თბილისი',
    address: 'ყაზბეგის გამზირი 24',
    phone: '+995 32 200 20 20',
    specialty: 'კარდიოლოგია და ნევროლოგია',
  },
  {
    id: 'clinic_3',
    name: 'ქუთაისის საოჯახო კლინიკა',
    city: 'ქუთაისი',
    address: 'რუსთაველის ქუჩა 8',
    phone: '+995 431 25 25 25',
    specialty: 'ოჯახის მედიცინა',
  },
];
