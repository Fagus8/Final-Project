// ხაზოვანი (outline) აიქონები — ერთი სტილით, 24x24 ბადეზე.
// გამოყენება: <Icon name="clock" size={16} />

// ყველა ხელმისაწვდომი იკონის სახელი (სხვა სახელს TypeScript არ მიიღებს)
export type IconName =
  | 'dashboard'
  | 'patients'
  | 'doctors'
  | 'clinic'
  | 'appointments'
  | 'profile'
  | 'bell'
  | 'search'
  | 'logout'
  | 'logo'
  | 'clock'
  | 'check'
  | 'arrowRight'
  | 'door'
  | 'pin'
  | 'phone'
  | 'chart'
  | 'shield'
  | 'calendarPlus'
  | 'stethoscope'
  | 'education'
  | 'language'
  | 'money'
  | 'home';

type IconProps = {
  name: IconName;
  size?: number;
};

export default function Icon({ name, size = 20 }: IconProps) {
  // ყველა იკონის საერთო პარამეტრები. currentColor-ით იკონი ტექსტის ფერს იღებს,
  // aria-hidden-ით ეკრანის წამკითხველი მას გამოტოვებს (დეკორაციაა)
  const sharedProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  };

  // თითოეული სახელისთვის თავისი SVG ნახატი
  switch (name) {
    case 'dashboard':
      return (
        <svg {...sharedProps}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case 'patients':
      return (
        <svg {...sharedProps}>
          <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
          <circle cx="10" cy="8" r="3.5" />
          <path d="M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35" />
          <path d="M15.5 4.6a3.5 3.5 0 0 1 0 6.8" />
        </svg>
      );
    case 'doctors':
    case 'stethoscope':
      return (
        <svg {...sharedProps}>
          <path d="M6 3v5a4 4 0 0 0 8 0V3" />
          <path d="M10 12v3a5 5 0 0 0 10 0v-2" />
          <circle cx="20" cy="11" r="2" />
        </svg>
      );
    case 'clinic':
      return (
        <svg {...sharedProps}>
          <path d="M4 21V7l8-4 8 4v14" />
          <path d="M3 21h18" />
          <path d="M12 8v5" />
          <path d="M9.5 10.5h5" />
          <path d="M10 21v-4h4v4" />
        </svg>
      );
    case 'appointments':
      return (
        <svg {...sharedProps}>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
          <path d="M8 3v4M16 3v4M3.5 10h17" />
        </svg>
      );
    case 'calendarPlus':
      return (
        <svg {...sharedProps}>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
          <path d="M8 3v4M16 3v4M3.5 10h17M12 13v5M9.5 15.5h5" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="8" r="4" />
          <path d="M5 20.5a7 7 0 0 1 14 0" />
        </svg>
      );
    case 'bell':
      return (
        <svg {...sharedProps}>
          <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9" />
          <path d="M10.3 20a1.9 1.9 0 0 0 3.4 0" />
        </svg>
      );
    case 'search':
      return (
        <svg {...sharedProps}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...sharedProps}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5M21 12H9" />
        </svg>
      );
    case 'logo':
      return (
        <svg {...sharedProps} strokeWidth={2.2}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'check':
      return (
        <svg {...sharedProps}>
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      );
    case 'arrowRight':
      return (
        <svg {...sharedProps}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      );
    case 'door':
      return (
        <svg {...sharedProps}>
          <path d="M5 21V4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5V21" />
          <path d="M3 21h18M15 12h.01" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...sharedProps}>
          <path d="M12 21s7-6.1 7-11.5a7 7 0 0 0-14 0C5 14.9 12 21 12 21z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
      );
    case 'phone':
      return (
        <svg {...sharedProps}>
          <path d="M5 4h3.5l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...sharedProps}>
          <path d="M4 20h16" />
          <path d="M7 16v-4M12 16V8M17 16v-7" />
        </svg>
      );
    case 'home':
      return (
        <svg {...sharedProps}>
          <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6h-6v6H5.5A1.5 1.5 0 0 1 4 19z" />
        </svg>
      );
    case 'education':
      return (
        <svg {...sharedProps}>
          <path d="M2.5 9 12 4.5 21.5 9 12 13.5z" />
          <path d="M6.5 11v4.5c0 1.4 2.5 3 5.5 3s5.5-1.6 5.5-3V11" />
          <path d="M21.5 9v5" />
        </svg>
      );
    case 'language':
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      );
    case 'money':
      return (
        <svg {...sharedProps}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M6.5 9.5v.01M17.5 14.5v.01" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...sharedProps}>
          <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
  }
}
