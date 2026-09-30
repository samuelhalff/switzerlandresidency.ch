import { cn } from "./cn";

/**
 * Soft hill / lake-line divider between tonal sections: one filled hill in currentColor with a faint
 * contour line above it. Set the colour of the section it leads into (e.g. `text-sand`).
 */
export default function WaveDivider({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1440 72"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={cn("block h-10 w-full sm:h-14 lg:h-[72px]", flip && "rotate-180", className)}
    >
      <path
        d="M0 30C160 12 300 4 460 12s260 34 420 36 300-26 420-30c60-2 110 2 140 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
        vectorEffect="non-scaling-stroke"
      />
      <path d="M0 72V52c150-18 300-30 470-20 190 11 300 34 480 30 180-4 300-26 490-24v34H0Z" fill="currentColor" />
    </svg>
  );
}
