import { GA_ID } from "@/lib/site";

/**
 * Consent Mode v2 bootstrap: everything denied by default. window.gtag is only exposed
 * (and gtag.js only injected) by <CookieBanner> after the visitor accepts, so trackEvent
 * is a no-op before consent. Rendered only when NEXT_PUBLIC_GA_ID is set.
 */
export default function AnalyticsBootstrap() {
  if (!GA_ID) return null;
  const code =
    "window.dataLayer=window.dataLayer||[];window.__srGtag=function(){window.dataLayer.push(arguments);};" +
    "window.__srGtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});";
  return <script id="consent-default" dangerouslySetInnerHTML={{ __html: code }} />;
}
