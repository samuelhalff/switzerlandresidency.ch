import { GA_ID } from "@/lib/site";
import { consentBootstrapScript } from "@/lib/consent";

/**
 * Consent Mode v2 ("advanced") bootstrap, first gtag code in <head>: region defaults, saved
 * choice, config, then gtag.js on every page (see consentBootstrapScript). <CookieBanner> only
 * stores the visitor's choice and issues consent updates. Rendered only when NEXT_PUBLIC_GA_ID is set.
 */
export default function AnalyticsBootstrap() {
  if (!GA_ID) return null;
  return <script id="consent-default" dangerouslySetInnerHTML={{ __html: consentBootstrapScript(GA_ID) }} />;
}
