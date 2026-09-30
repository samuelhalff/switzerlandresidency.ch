"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  CHECK_STORAGE_KEY,
  evaluate,
  serializeAnswers,
  type Activity,
  type AgeBand,
  type Answers,
  type CheckResult,
  type Citizenship,
  type Household,
  type OtherRegion,
  type Region,
  type Spending,
  type StoredCheck,
  type TaxResidence,
  type Timeline,
} from "@/lib/eligibility";
import { format, type Messages } from "@/lib/i18n";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Chip from "./ui/Chip";
import IconBadge from "./ui/IconBadge";

type Props = {
  labels: Messages["check"];
  cantonNames: Messages["cantonNames"];
  contactHref: string;
};

type Draft = Partial<Omit<Answers, "citizenships">> & { citizenships: Citizenship[] };

const TOTAL = 6;

function keysOf<T extends object>(o: T): (keyof T & string)[] {
  return Object.keys(o) as (keyof T & string)[];
}

function Choice({
  type,
  name,
  value,
  checked,
  onChange,
  children,
}: {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label
      className={`flex min-h-[54px] cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 transition-[background-color,box-shadow] duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--focus)] ${
        checked
          ? "bg-blush shadow-[inset_0_0_0_2px_rgb(var(--accent))]"
          : "bg-bg shadow-[inset_0_0_0_1px_rgb(var(--line))] hover:bg-sand"
      }`}
    >
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 shrink-0 accent-[rgb(var(--accent))] focus-visible:outline-none"
      />
      <span>{children}</span>
    </label>
  );
}

function Group({
  legend,
  hint,
  children,
  cols = 1,
  hideLegend = false,
}: {
  legend: string;
  hint?: string;
  children: ReactNode;
  cols?: 1 | 2;
  /** The step heading already shows the question; keep the legend for screen readers only. */
  hideLegend?: boolean;
}) {
  return (
    <fieldset className="mt-6 first:mt-0">
      <legend className={hideLegend ? "sr-only" : "text-base font-semibold"}>{legend}</legend>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
      <div className={`mt-3 grid gap-2 ${cols === 2 ? "sm:grid-cols-2" : ""}`}>{children}</div>
    </fieldset>
  );
}

export default function EligibilityCheck({ labels: L, cantonNames, contactHref }: Props) {
  const [step, setStep] = useState(0); // 0 = intro, 1..6 = questions, 7 = result
  const [a, setA] = useState<Draft>({ citizenships: [] });
  const [error, setError] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setA((prev) => ({ ...prev, [key]: value }));
    setError(false);
  };

  const toggleCitizenship = (c: Citizenship) => {
    setA((prev) => {
      const has = prev.citizenships.includes(c);
      const citizenships = has ? prev.citizenships.filter((x) => x !== c) : [...prev.citizenships, c];
      return { ...prev, citizenships, otherRegion: citizenships.includes("OTHER") ? prev.otherRegion : undefined };
    });
    setError(false);
  };

  const stepValid = (n: number): boolean => {
    switch (n) {
      case 1:
        return a.citizenships.length > 0 && (!a.citizenships.includes("OTHER") || !!a.otherRegion);
      case 2:
        return !!a.taxResidence;
      case 3:
        return !!a.activity;
      case 4:
        return !!a.household && a.children !== undefined && !!a.age && a.livedInChLast10y !== undefined;
      case 5:
        return !!a.spending;
      case 6:
        return !!a.region && !!a.timeline;
      default:
        return true;
    }
  };

  const next = () => {
    if (!stepValid(step)) {
      setError(true);
      return;
    }
    trackEvent(`eligibility_step_${step}`);
    if (step === TOTAL) {
      const r = evaluate(a as Answers);
      trackEvent("eligibility_result", { route: r.routes.join("+"), lump_sum: r.lumpSum });
    }
    setStep(step + 1);
  };

  const back = () => {
    setError(false);
    setStep(Math.max(0, step - 1));
  };

  const start = () => {
    trackEvent("eligibility_start");
    setStep(1);
  };

  const restart = () => {
    setA({ citizenships: [] });
    setStep(1);
  };

  if (step === 0) {
    return (
      <Card padding="lg">
        <IconBadge icon="compass" tone="blush" size="lg" />
        <p className="mt-6 text-lg leading-relaxed text-muted sm:text-xl">{L.intro}</p>
        <div className="mt-8">
          <Button size="lg" onClick={start}>
            {L.start}
          </Button>
        </div>
        <p className="mt-8 text-sm text-muted">{L.result.disclaimer}</p>
      </Card>
    );
  }

  if (step > TOTAL) {
    const result = evaluate(a as Answers);
    return <Result L={L} result={result} answers={a as Answers} cantonNames={cantonNames} contactHref={contactHref} onRestart={restart} headingRef={headingRef} />;
  }

  const titles = [L.q1.title, L.q2.title, L.q3.title, L.q4.title, L.q5.title, L.q6.title];

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between gap-4 text-sm text-muted">
        <span>{format(L.stepOf, { current: step, total: TOTAL })}</span>
      </div>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-sand"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL}
        aria-valuenow={step}
        aria-label={format(L.stepOf, { current: step, total: TOTAL })}
      >
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(step / TOTAL) * 100}%` }} />
      </div>

      <h2 ref={headingRef} tabIndex={-1} className="mt-8 text-2xl focus:outline-none sm:text-3xl">
        {titles[step - 1]}
      </h2>

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        {step === 1 ? (
          <>
            <Group legend={L.q1.title} hint={L.q1.hint} cols={2} hideLegend>
              {keysOf(L.q1.options).map((c) => (
                <Choice key={c} type="checkbox" name="citizenship" value={c} checked={a.citizenships.includes(c)} onChange={() => toggleCitizenship(c)}>
                  {L.q1.options[c]}
                </Choice>
              ))}
            </Group>
            {a.citizenships.includes("OTHER") ? (
              <Group legend={L.q1.otherLabel} cols={2}>
                {keysOf(L.q1.otherOptions).map((r) => (
                  <Choice key={r} type="radio" name="otherRegion" value={r} checked={a.otherRegion === r} onChange={() => set("otherRegion", r as OtherRegion)}>
                    {L.q1.otherOptions[r]}
                  </Choice>
                ))}
              </Group>
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <Group legend={L.q2.title} cols={2} hideLegend>
            {keysOf(L.q2.options).map((v) => (
              <Choice key={v} type="radio" name="taxResidence" value={v} checked={a.taxResidence === v} onChange={() => set("taxResidence", v as TaxResidence)}>
                {L.q2.options[v]}
              </Choice>
            ))}
          </Group>
        ) : null}

        {step === 3 ? (
          <Group legend={L.q3.title} hideLegend>
            {keysOf(L.q3.options).map((v) => (
              <Choice key={v} type="radio" name="activity" value={v} checked={a.activity === v} onChange={() => set("activity", v as Activity)}>
                {L.q3.options[v]}
              </Choice>
            ))}
          </Group>
        ) : null}

        {step === 4 ? (
          <>
            <Group legend={L.q4.householdLabel} cols={2}>
              {keysOf(L.q4.household).map((v) => (
                <Choice key={v} type="radio" name="household" value={v} checked={a.household === v} onChange={() => set("household", v as Household)}>
                  {L.q4.household[v]}
                </Choice>
              ))}
            </Group>
            <Group legend={L.q4.childrenLabel} cols={2}>
              <Choice type="radio" name="children" value="yes" checked={a.children === true} onChange={() => set("children", true)}>
                {L.yes}
              </Choice>
              <Choice type="radio" name="children" value="no" checked={a.children === false} onChange={() => set("children", false)}>
                {L.no}
              </Choice>
            </Group>
            <Group legend={L.q4.ageLabel} cols={2}>
              {keysOf(L.q4.age).map((v) => (
                <Choice key={v} type="radio" name="age" value={v} checked={a.age === v} onChange={() => set("age", v as AgeBand)}>
                  {L.q4.age[v]}
                </Choice>
              ))}
            </Group>
            <Group legend={L.q4.livedLabel} cols={2}>
              <Choice type="radio" name="lived" value="yes" checked={a.livedInChLast10y === true} onChange={() => set("livedInChLast10y", true)}>
                {L.yes}
              </Choice>
              <Choice type="radio" name="lived" value="no" checked={a.livedInChLast10y === false} onChange={() => set("livedInChLast10y", false)}>
                {L.no}
              </Choice>
            </Group>
          </>
        ) : null}

        {step === 5 ? (
          <Group legend={L.q5.title} hint={L.q5.hint} hideLegend>
            {keysOf(L.q5.options).map((v) => (
              <Choice key={v} type="radio" name="spending" value={v} checked={a.spending === v} onChange={() => set("spending", v as Spending)}>
                {L.q5.options[v]}
              </Choice>
            ))}
          </Group>
        ) : null}

        {step === 6 ? (
          <>
            <Group legend={L.q6.regionLabel} cols={2}>
              {keysOf(L.q6.regions).map((v) => (
                <Choice key={v} type="radio" name="region" value={v} checked={a.region === v} onChange={() => set("region", v as Region)}>
                  {L.q6.regions[v]}
                </Choice>
              ))}
            </Group>
            <Group legend={L.q6.timelineLabel} cols={2}>
              {keysOf(L.q6.timelines).map((v) => (
                <Choice key={v} type="radio" name="timeline" value={v} checked={a.timeline === v} onChange={() => set("timeline", v as Timeline)}>
                  {L.q6.timelines[v]}
                </Choice>
              ))}
            </Group>
          </>
        ) : null}

        {error ? (
          <p role="alert" className="mt-5 text-sm font-medium text-accent">
            {L.required}
          </p>
        ) : null}

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button variant="secondary" onClick={back}>
            {L.back}
          </Button>
          <Button type="submit">{step === TOTAL ? L.seeResult : L.next}</Button>
        </div>
      </form>
    </Card>
  );
}

function Result({
  L,
  result,
  answers,
  cantonNames,
  contactHref,
  onRestart,
  headingRef,
}: {
  L: Messages["check"];
  result: CheckResult;
  answers: Answers;
  cantonNames: Messages["cantonNames"];
  contactHref: string;
  onRestart: () => void;
  headingRef: RefObject<HTMLHeadingElement>;
}) {
  const [primary, ...others] = result.routes;
  const cantons = result.cantons.map((c) => cantonNames[c]);
  const lump = L.lumpSum[result.lumpSum];

  const send = () => {
    const stored: StoredCheck = {
      routes: result.routes,
      lumpSum: result.lumpSum,
      cantons: result.cantons,
      flags: result.flags,
      answers: serializeAnswers(answers),
      summary: [
        `${L.result.route}: ${result.routes.map((r) => L.routes[r].label).join(" / ")}`,
        `${L.result.lumpSum}: ${lump.label}`,
        `${L.result.cantons}: ${cantons.join(", ")}`,
      ],
    };
    try {
      window.sessionStorage.setItem(CHECK_STORAGE_KEY, JSON.stringify(stored));
    } catch {
      /* storage blocked: the contact form still works without the result */
    }
    window.location.assign(`${contactHref}#form`);
  };

  return (
    <Card padding="lg" aria-live="polite">
      <h2 ref={headingRef} tabIndex={-1} className="text-3xl focus:outline-none">
        {L.result.title}
      </h2>

      <dl className="mt-8 space-y-6">
        <div className="rounded-tile bg-blush p-5 sm:p-6">
          <dt className="text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-muted">{L.result.route}</dt>
          <dd className="mt-2">
            <p className="font-serif text-2xl">{L.routes[primary].label}</p>
            <p className="mt-2 text-muted">{L.routes[primary].text}</p>
            {others.length ? (
              <div className="mt-4">
                <p className="text-sm font-semibold">{L.result.alsoPossible}</p>
                {others.map((r) => (
                  <p key={r} className="mt-1 text-sm text-muted">
                    <strong className="font-semibold text-ink">{L.routes[r].label}.</strong> {L.routes[r].text}
                  </p>
                ))}
              </div>
            ) : null}
          </dd>
        </div>

        <div>
          <dt className="text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-muted">{L.result.lumpSum}</dt>
          <dd className="mt-2">
            <p className="font-serif text-xl">{lump.label}</p>
            <p className="mt-1 text-muted">{lump.text}</p>
            {result.coupleNote ? <p className="mt-2 text-sm text-muted">{L.lumpSum.coupleNote}</p> : null}
            {result.r4Flag ? <p className="mt-2 text-sm font-medium">{L.lumpSum.r4Flag}</p> : null}
          </dd>
        </div>

        <div>
          <dt className="text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-muted">{L.result.cantons}</dt>
          <dd className="mt-2">
            <ul className="flex flex-wrap gap-2">
              {cantons.map((c) => (
                <li key={c}>
                  <Chip icon="pin" className="bg-bg">
                    {c}
                  </Chip>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted">{L.result.cantonNote}</p>
          </dd>
        </div>

        <div>
          <dt className="text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-muted">{L.result.flags}</dt>
          <dd className="mt-2">
            {result.flags.length ? (
              <ul className="list-disc space-y-2 pl-5">
                {result.flags.map((f) => (
                  <li key={f}>{L.flags[f]}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">{L.result.noFlags}</p>
            )}
          </dd>
        </div>

        <div>
          <dt className="text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-muted">{L.result.needs}</dt>
          <dd className="mt-2">
            <ul className="list-disc space-y-1 pl-5 text-muted">
              {L.needs.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>

      <Card tone="evening" padding="md" className="mt-10">
        <h3 className="text-2xl">{L.result.nextTitle}</h3>
        <p className="mt-2 text-muted">{L.result.nextText}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={send}>{L.result.send}</Button>
          <Button variant="secondary" onClick={onRestart}>
            {L.restart}
          </Button>
        </div>
      </Card>

      <p className="mt-6 text-sm text-muted">{L.result.disclaimer}</p>
    </Card>
  );
}
