/** Inline SVG icon set, matching the line weight of the design reference. */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  'aria-hidden': true,
  ...props,
  className: props.className ?? 'h-[18px] w-[18px]',
});

export const IconHome = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 21h18M5 21V8l7-5 7 5v13" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export const IconGrid = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const IconList = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconCard = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const IconClock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconUser = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 20c1.2-3.4 4-5 7-5s5.8 1.6 7 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconPin = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const IconRupee = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v18M17 7H9.5a3 3 0 0 0 0 6H14a3 3 0 0 1 0 6H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconPlus = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconClose = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const IconArea = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 4h6M4 4v6M20 20h-6M20 20v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconDownload = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v13m0 0 4-4m-4 4-4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconSofa = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      d="M4 11V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M3 11h18v6M6 17v2M18 17v2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconSparkle = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      d="M12 3v4M12 21v-4M5 12H3m18 0h-2M6 6l2 2m8 8 2 2M6 18l2-2m8-8 2-2"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const IconWrench = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      d="M14.5 5.5a3.5 3.5 0 0 0-4.8 4.3l-6 6 2 2 6-6a3.5 3.5 0 0 0 4.3-4.8L14 9l-1-1 1.5-2.5Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconCart = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.55L20 8H6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="10" cy="20" r="1.4" fill="currentColor" />
    <circle cx="17.5" cy="20" r="1.4" fill="currentColor" />
  </svg>
);

export const IconHeart = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      d="M12 20s-7-4.4-7-9.2A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.8C19 15.6 12 20 12 20Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconDoc = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 3h7l4 4v14H7V3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M14 3v4h4M10 13h5M10 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconStar = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      d="m12 4 2.3 4.9 5.2.7-3.8 3.6 1 5.2L12 16l-4.7 2.4 1-5.2L4.5 9.6l5.2-.7L12 4Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconCoin = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.3" opacity=".55" />
    <path d="M12 9v6m-1.6-4.2h3.2M10.4 13.2h3.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const IconGift = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="9" width="17" height="11.5" rx="1.8" stroke="currentColor" strokeWidth="1.8" />
    <path d="M2.5 9h19v3.4h-19zM12 9v11.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path
      d="M12 9C10.6 5.9 9.4 4.5 8.1 4.5a2 2 0 0 0 0 4.5H12Zm0 0c1.4-3.1 2.6-4.5 3.9-4.5a2 2 0 0 1 0 4.5H12Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconMedal = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8.5 3h7l-2.2 7h-2.6L8.5 3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    <circle cx="12" cy="15" r="5.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="m12 12.3 1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2L8.8 14.6l2.2-.3 1-2Z" fill="currentColor" opacity=".7" />
  </svg>
);

export const IconMenu = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const IconLogout = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M15 12H4m0 0 3.5-3.5M4 12l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 5h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconBolt = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M13.5 3 6 13h4.5l-.5 8L18 11h-4.7l.2-8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export const IconDrop = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5c3.2 3.6 5 6.4 5 8.9a5 5 0 0 1-10 0c0-2.5 1.8-5.3 5-8.9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export const IconWifi = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 9.2a13 13 0 0 1 17 0M6.6 12.6a8.4 8.4 0 0 1 10.8 0M9.7 16a3.9 3.9 0 0 1 4.6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="19" r="1.15" fill="currentColor" />
  </svg>
);

export const IconKey = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="8.2" cy="12" r="3.7" stroke="currentColor" strokeWidth="1.8" />
    <path d="M11.9 12H20m-2.6 0v3.1M14.8 12v2.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconBell = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      d="M6.5 10a5.5 5.5 0 0 1 11 0c0 3 .7 4.6 1.5 5.6H5c.8-1 1.5-2.6 1.5-5.6Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <path d="M10 18.4a2.1 2.1 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const IconInfo = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 11v5.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    <circle cx="12" cy="7.9" r="1.05" fill="currentColor" />
  </svg>
);

export const IconHelp = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path
      d="M9.6 9.3a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.7-.9 1.3v.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    <circle cx="12" cy="16.4" r="1.05" fill="currentColor" />
  </svg>
);

export const IconChat = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      d="M20 12.6c0 3.4-3.6 6.1-8 6.1a9.6 9.6 0 0 1-2.4-.3L5 20l1.2-3.1C4.8 15.8 4 14.3 4 12.6 4 9.2 7.6 6.5 12 6.5s8 2.7 8 6.1Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconPhone = (p: IconProps) => (
  <svg {...base(p)}>
    <path
      d="M8.2 4.5h-2A1.7 1.7 0 0 0 4.5 6.3C4.5 13.6 10.4 19.5 17.7 19.5a1.7 1.7 0 0 0 1.8-1.7v-2l-3.6-1.3-1.7 1.9a12.3 12.3 0 0 1-4.6-4.6l1.9-1.7L8.2 4.5Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

export const IconMail = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="m4.5 7.5 7.5 5.2 7.5-5.2" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
);

export const IconChevron = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m8 10 4 4 4-4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const IconShield = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.2 5 6v5.4c0 4 2.8 7.6 7 9.4 4.2-1.8 7-5.4 7-9.4V6l-7-2.8Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="m9 12 2.2 2.2L15.4 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const BrandMark = (p: IconProps) => (
  <svg viewBox="0 0 34 34" fill="none" aria-hidden {...p}>
    <rect x="1" y="1" width="32" height="32" rx="9" fill="#153726" />
    <path d="M8 17.5 17 9l9 8.5" stroke="#CE8A22" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 16v9h6v-6h2v6h6v-9" stroke="#EAF2E7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
