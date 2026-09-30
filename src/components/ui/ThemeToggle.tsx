"use client";

import { useEffect, useState } from "react";
import Icon, { type IconName } from "./Icon";
import { cn } from "./cn";
import { THEME_COLORS, THEME_STORAGE_KEY, type ThemePref } from "@/lib/theme";

const SYNC_EVENT = "sr-theme-change";

const options: { value: ThemePref; icon: IconName }[] = [
  { value: "light", icon: "sun" },
  { value: "dark", icon: "moon" },
  { value: "system", icon: "monitor" },
];

function readPref(): ThemePref {
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

/** Keeps <meta name="theme-color"> matching the effective theme (manual choice wins). */
function syncThemeColorMeta(pref: ThemePref) {
  const dark = pref === "dark" || (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? THEME_COLORS.dark : THEME_COLORS.light);
}

function applyPref(pref: ThemePref) {
  const root = document.documentElement;
  if (pref === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
  syncThemeColorMeta(pref);
  try {
    if (pref === "system") window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* storage blocked: the choice still applies to this page view */
  }
}

type Labels = { label: string; light: string; dark: string; system: string };

/**
 * Light / dark / system switch as a native radio group (arrow keys work).
 * `compact` shows icons only (header); `full` adds the text labels (mobile menu).
 */
export default function ThemeToggle({
  labels,
  variant = "compact",
  name,
  className,
}: {
  labels: Labels;
  variant?: "compact" | "full";
  /** Unique radio group name when several toggles are on the page. */
  name: string;
  className?: string;
}) {
  const [pref, setPref] = useState<ThemePref>("system");

  useEffect(() => {
    setPref(readPref());
    const onSync = (e: Event) => setPref((e as CustomEvent<ThemePref>).detail);
    const onStorage = (e: StorageEvent) => {
      if (e.key !== THEME_STORAGE_KEY) return;
      const next = readPref();
      applyPref(next);
      setPref(next);
    };
    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const choose = (value: ThemePref) => {
    applyPref(value);
    setPref(value);
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: value }));
  };

  const full = variant === "full";
  return (
    <div
      role="radiogroup"
      aria-label={labels.label}
      className={cn("inline-flex items-center gap-0.5 rounded-full p-1 shadow-[inset_0_0_0_1px_rgb(var(--line))]", full && "w-full", className)}
    >
      {options.map((o) => {
        const checked = pref === o.value;
        return (
          <label
            key={o.value}
            title={labels[o.value]}
            className={cn(
              "relative inline-flex cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors duration-200",
              "has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)]",
              full ? "h-10 flex-1 px-3" : "h-8 w-8",
              checked ? "bg-ink text-bg" : "text-ink/65 hover:text-ink",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={checked}
              onChange={() => choose(o.value)}
              className="sr-only"
            />
            <Icon name={o.icon} size={full ? 18 : 17} />
            <span className={full ? "" : "sr-only"}>{labels[o.value]}</span>
          </label>
        );
      })}
    </div>
  );
}
