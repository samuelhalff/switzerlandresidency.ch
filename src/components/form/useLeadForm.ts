"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { centeredScrollTop, validateField, validateForm, type FieldRule } from "@/lib/form-validation";
import { fieldValue } from "@/lib/formspark";

export type FormStatus = "idle" | "sending" | "success" | "error";

/**
 * Scroll so `el` (or its whole field block: label + control + message) sits in the middle of the
 * visible part of the viewport — below the sticky header and above the cookie banner.
 * When the form's footer (error summary + submit button) is close enough to fit in the same
 * view, the field and the footer are centred together, so the button is never left under the banner.
 */
export function scrollIntoVisibleCenter(el: HTMLElement) {
  const block = el.closest<HTMLElement>("[data-field]") ?? el;
  const rect = block.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const header = document.querySelector<HTMLElement>(".site-header")?.getBoundingClientRect();
  const banner = document.querySelector<HTMLElement>(".cookie-banner")?.getBoundingClientRect();
  const topInset = header ? Math.max(0, header.bottom) : 0;
  const bottomInset = banner && banner.height > 0 ? Math.max(0, viewportHeight - banner.top) : 0;

  let top = rect.top;
  let height = rect.height;
  const footer = el.closest("form")?.querySelector<HTMLElement>("[data-form-footer]")?.getBoundingClientRect();
  if (footer && footer.bottom > rect.bottom && footer.bottom - rect.top + 32 <= viewportHeight - topInset - bottomInset) {
    top = Math.min(rect.top, footer.top);
    height = footer.bottom - top;
  }

  window.scrollTo({
    top: centeredScrollTop({
      elementTop: top,
      elementHeight: height,
      scrollY: window.scrollY,
      viewportHeight,
      topInset,
      bottomInset,
      maxScroll: document.documentElement.scrollHeight - viewportHeight,
    }),
  });
}

/** Move focus to an element and bring it into view (used for the first invalid field and status panels). */
export function focusAndReveal(el: HTMLElement | null) {
  if (!el) return;
  scrollIntoVisibleCenter(el);
  el.focus({ preventScroll: true });
}

function ruleValue(rule: FieldRule, data: FormData): string | boolean {
  return rule.kind === "checkbox" ? data.get(rule.name) === "on" : fieldValue(data, rule.name);
}

/**
 * Submit lifecycle shared by the contact and adviser forms: per-field validation, focus on the
 * first invalid field, a single in-flight request, and success / error status.
 * `send` receives the validated FormData and throws when the request fails.
 */
export function useLeadForm(rules: readonly FieldRule[], send: (data: FormData) => Promise<void>) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusRequest, setFocusRequest] = useState<{ id: string } | null>(null);
  const busy = useRef(false);

  // After the error messages have rendered (they shift the layout), reveal the first invalid field.
  useEffect(() => {
    if (focusRequest) focusAndReveal(document.getElementById(focusRequest.id));
  }, [focusRequest]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy.current) return; // double tap / Enter while a request is running
    const data = new FormData(e.currentTarget);

    const found = validateForm(rules, Object.fromEntries(rules.map((r) => [r.name, ruleValue(r, data)])));
    setErrors(Object.fromEntries(found.map((f) => [f.name, f.message])));
    if (found.length) {
      setStatus("idle");
      setFocusRequest({ id: found[0].id });
      return;
    }

    // Bots fill hidden fields: pretend success, send nothing.
    if (fieldValue(data, "_honeypot")) {
      setStatus("success");
      return;
    }

    busy.current = true;
    setStatus("sending");
    try {
      await send(data);
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      busy.current = false;
    }
  }

  /** Form-level change handler: an error disappears as soon as its field becomes valid. */
  function onChange(e: FormEvent<HTMLFormElement>) {
    const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const name = target.name;
    if (!name || !errors[name]) return;
    const rule = rules.find((r) => r.name === name);
    if (!rule) return;
    const value = rule.kind === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    if (validateField(rule, value) !== null) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  return { status, errors, errorCount: Object.keys(errors).length, onSubmit, onChange };
}
