import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import type { AnalyticsEvent } from "@/lib/analytics";
import TrackedLink from "../TrackedLink";
import Icon from "./Icon";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
export type ButtonSize = "sm" | "md" | "lg";

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to the container width (on mobile only with "mobile"). */
  fullWidth?: boolean | "mobile";
  className?: string;
  /** link variant only: trailing arrow that nudges on hover. */
  arrow?: boolean;
  children: ReactNode;
};

type LinkProps = Common &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children"> & {
    href: string;
    /** Render a plain <a> (full page load) instead of next/link. */
    native?: boolean;
    /** Fire an analytics event on click (renders a small client link). */
    track?: { event: AnalyticsEvent; params?: Record<string, string> };
  };

type NativeButtonProps = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };

export type ButtonProps = LinkProps | NativeButtonProps;

// Literal class names (Tailwind only keeps classes it can find verbatim in the source).
const variantClass = { primary: "btn-primary", secondary: "btn-secondary", ghost: "btn-ghost" } as const;
const sizeClass = { sm: "btn-sm", md: "btn-md", lg: "btn-lg" } as const;

/** Class string for a button; exported for the rare element that cannot be a <Button>. */
export function buttonClasses({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: Pick<Common, "variant" | "size" | "fullWidth" | "className">): string {
  if (variant === "link") return cn("btn-link", className);
  return cn(
    "btn",
    variantClass[variant],
    sizeClass[size],
    fullWidth === true && "w-full",
    fullWidth === "mobile" && "w-full sm:w-auto",
    className,
  );
}

function Inner({ variant, arrow, children }: { variant: ButtonVariant; arrow?: boolean; children: ReactNode }) {
  if (variant === "link") {
    // No wrapping <span> and no flex layout: the arrow must flow inline right after the
    // last word of the (possibly wrapped) text, not sit flex-centred at the far edge.
    return (
      <>
        {children}
        {arrow ? <Icon name="arrow" size={17} className="btn-arrow" /> : null}
      </>
    );
  }
  return <span>{children}</span>;
}

/**
 * The one button of the site. Renders <a> when `href` is given, <button> otherwise.
 * primary / secondary / ghost share ark-fid.ch's rising-wave hover. Use ONE primary per view;
 * secondary actions are `variant="link"` (underlined text, optional arrow).
 */
export default function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", fullWidth, className, arrow, children } = props;
  const classes = buttonClasses({ variant, size, fullWidth, className });

  if (props.href !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { variant: _v, size: _s, fullWidth: _f, className: _c, arrow: _a, children: _ch, native, track, href, ...rest } = props;
    const inner = (
      <Inner variant={variant} arrow={arrow}>
        {children}
      </Inner>
    );
    if (track) {
      return (
        <TrackedLink href={href} className={classes} event={track.event} params={track.params} {...rest}>
          {inner}
        </TrackedLink>
      );
    }
    const internal = href.startsWith("/") && !native;
    return internal ? (
      <Link href={href} className={classes} {...rest}>
        {inner}
      </Link>
    ) : (
      <a href={href} className={classes} {...rest}>
        {inner}
      </a>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variant: _v, size: _s, fullWidth: _f, className: _c, arrow: _a, children: _ch, href: _h, type = "button", ...rest } = props;
  return (
    <button type={type} className={classes} {...rest}>
      <Inner variant={variant} arrow={arrow}>
        {children}
      </Inner>
    </button>
  );
}
