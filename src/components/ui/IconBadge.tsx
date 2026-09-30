import Icon, { type IconName } from "./Icon";
import { cn } from "./cn";

const tones = {
  sand: "bg-sand text-accent",
  sage: "bg-sage text-lake",
  blush: "bg-blush text-accent",
  caramel: "bg-caramel text-ink",
  surface: "bg-surface text-accent shadow-soft",
  accent: "bg-accent text-bg",
  evening: "bg-evening text-on-evening",
} as const;

export type IconBadgeTone = keyof typeof tones;

/** Icon on a soft, slightly organic tinted shape. Decorative. */
export default function IconBadge({
  icon,
  tone = "sand",
  size = "md",
  className,
}: {
  icon: IconName;
  tone?: IconBadgeTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = size === "sm" ? "h-10 w-10" : size === "lg" ? "h-16 w-16" : "h-12 w-12";
  const iconSize = size === "sm" ? 20 : size === "lg" ? 30 : 24;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[42%_58%_55%_45%/48%_44%_56%_52%]",
        box,
        tones[tone],
        className,
      )}
    >
      <Icon name={icon} size={iconSize} />
    </span>
  );
}
