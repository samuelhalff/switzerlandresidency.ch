"use client";

import { useEffect, useState } from "react";
import AdviserForm, { type AdviserFormProps } from "./AdviserForm";
import ContactForm, { type ContactFormProps } from "./ContactForm";
import AccentText from "./ui/AccentText";

/**
 * /contact/ renders the client form; /contact/?type=adviser swaps in the "Introduce a client" form.
 * Static export: the query is read in the browser after hydration.
 */
export default function ContactFormSwitch({
  contact,
  adviser,
}: {
  contact: ContactFormProps;
  adviser: AdviserFormProps;
}) {
  const [isAdviser, setIsAdviser] = useState(false);
  useEffect(() => {
    setIsAdviser(new URLSearchParams(window.location.search).get("type") === "adviser");
  }, []);

  if (!isAdviser) return <ContactForm {...contact} />;
  return (
    <div>
      <h2 className="text-[1.75rem] sm:text-[2rem]">
        <AccentText text={adviser.adviser.title} accent={adviser.adviser.accent} />
      </h2>
      <p className="mb-8 mt-3 max-w-xl text-muted">{adviser.adviser.lead}</p>
      <AdviserForm {...adviser} />
    </div>
  );
}
