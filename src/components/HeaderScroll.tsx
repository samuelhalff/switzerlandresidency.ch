"use client";

import { useEffect } from "react";

/** Marks the header solid once the page is scrolled (it is transparent over a full-bleed hero at the top). */
export default function HeaderScroll() {
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    if (!header) return;
    const update = () => header.toggleAttribute("data-solid", window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return null;
}
