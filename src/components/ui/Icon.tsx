import type { ReactNode } from "react";

/** Small line-icon set (24px grid, 1.7 stroke, currentColor). Decorative: always aria-hidden. */
const paths = {
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8-8M16 7l2 2M14 9l2 2" />
    </>
  ),
  scale: (
    <>
      <path d="M12 4v16M8 20h8M5 7h14M5 7l-2.5 6a3 3 0 0 0 5 0L5 7ZM19 7l-2.5 6a3 3 0 0 0 5 0L19 7Z" />
      <circle cx="12" cy="4" r="1" />
    </>
  ),
  document: (
    <>
      <path d="M7 3h7l4 4v14H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4M9.5 13.5l2 2 3.5-4" />
    </>
  ),
  house: (
    <>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 9.5V20h12V9.5M10 20v-5h4v5" />
    </>
  ),
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />,
  sprout: (
    <>
      <path d="M12 21v-9" />
      <path d="M12 12c0-4 2.5-6.5 7-6.5 0 4.5-2.5 6.5-7 6.5ZM12 14c0-3.2-2.2-5.5-6.5-5.5 0 3.7 2.2 5.5 6.5 5.5Z" />
    </>
  ),
  mountain: (
    <>
      <path d="m3 19 6.5-11 4 6.5 2-3L21 19H3Z" />
      <path d="m8 10.5 1.5 1.3 1.5-1.3" />
    </>
  ),
  waves: <path d="M3 9c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M3 14c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M3 19c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
  monitor: (
    <>
      <rect x="3" y="4.5" width="18" height="12" rx="2" />
      <path d="M9 20h6M12 16.5V20" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </>
  ),
  stars: (
    <>
      <circle cx="12" cy="5" r="1" />
      <circle cx="17" cy="7" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="17" cy="17" r="1" />
      <circle cx="12" cy="19" r="1" />
      <circle cx="7" cy="17" r="1" />
      <circle cx="5" cy="12" r="1" />
      <circle cx="7" cy="7" r="1" />
    </>
  ),
  plane: <path d="M21 15.5 13.5 11V5.5a1.5 1.5 0 0 0-3 0V11L3 15.5V17l7.5-2.2V19L8.5 20.5V22l3.5-1 3.5 1v-1.5L13.5 19v-4.2L21 17v-1.5Z" />,
  lantern: (
    <>
      <path d="M12 2v2M9 4h6M8 7h8l-1-3H9L8 7ZM8 7c-1.5 2-1.5 8 0 10h8c1.5-2 1.5-8 0-10M9 17l1 3h4l1-3" />
      <path d="M12 9.5c-1 1-1 3.5 0 5 1-1.5 1-4 0-5Z" />
    </>
  ),
  chat: <path d="M5 18.5 3.5 21l.8-3.6A8 8 0 1 1 12 20a8.2 8.2 0 0 1-4-1l-3 .5" />,
  family: (
    <>
      <circle cx="8" cy="6.5" r="2.5" />
      <circle cx="16.5" cy="8" r="2" />
      <path d="M3.5 20v-4a4.5 4.5 0 0 1 9 0v4M13 20v-3a3.5 3.5 0 0 1 7 0v3" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  sparkle: <path d="M12 3c.6 4.2 2.8 6.4 7 7-4.2.6-6.4 2.8-7 7-.6-4.2-2.8-6.4-7-7 4.2-.6 6.4-2.8 7-7Z" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof paths;

export default function Icon({ name, size = 22, className = "" }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
