/** The few line icons the shop needs, drawn on a 24 px grid. Decorative unless given a label. */
const PATHS = {
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z",
  bag: "M6 8h12l-1 12H7L6 8Zm3 0V7a3 3 0 0 1 6 0v1",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6",
  back: "M15 5l-7 7 7 7",
  check: "M5 12.5l4.5 4.5L19 7.5",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  close: "M6 6l12 12M18 6L6 18",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm6.5 10.5.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z",
  layers: "M12 3l9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 4 9 5 9-5",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  shield: "M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6l8-3Zm-3.5 9 2.5 2.5 4.5-5",
  chat: "M4 5h16v11H8l-4 4V5Zm4 5h8m-8 3h5",
  calendar: "M4 6h16v14H4V6Zm0 4h16M8 3v4m8-4v4",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, label }: { name: IconName; size?: number; label?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
