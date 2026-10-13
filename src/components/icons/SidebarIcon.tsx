type SidebarIconProps = {
  name: 'dashboard' | 'patients' | 'doctors' | 'clinic' | 'appointments' | 'profile';
};

export default function SidebarIcon({ name }: SidebarIconProps) {
  const sharedProps = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    'aria-hidden': true as const,
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg {...sharedProps}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'patients':
      return (
        <svg {...sharedProps}>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'doctors':
      return (
        <svg {...sharedProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
      );
    case 'clinic':
      return (
        <svg {...sharedProps}>
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4 8 4v14" />
        <path d="M10 9h4" />
        <path d="M12 7v4" />
        <line x1="19" y1="10" x2="19" y2="16" />
        <line x1="16" y1="13" x2="22" y2="13" />
        </svg>
      );
    case 'appointments':
      return (
        <svg {...sharedProps}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <line x1="16" y1="3" x2="16" y2="7" />
          <line x1="8" y1="3" x2="8" y2="7" />
          <line x1="3" y1="11" x2="21" y2="11" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...sharedProps}>
          <circle cx="12" cy="8" r="4" />
          <path d="M5 21a7 7 0 0 1 14 0" />
        </svg>
      );
  }
}
