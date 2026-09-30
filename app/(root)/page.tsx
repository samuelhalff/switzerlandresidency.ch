import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Switzerland Residency",
  // Redirect-only page: never indexed; follow links unless the site-wide noindex gate is on.
  robots: { index: false, follow: process.env.NEXT_PUBLIC_NOINDEX !== "true" },
  alternates: { canonical: `${SITE_URL}/en/` },
};

// Fallback for hosts that ignore .htaccess: pick fr/de from the browser, else /en/.
const redirect = `(function(){try{var l=(navigator.languages||[navigator.language||'']).map(function(x){return String(x).slice(0,2).toLowerCase()});for(var i=0;i<l.length;i++){if(l[i]==='fr'||l[i]==='de'||l[i]==='en'){location.replace('/'+l[i]+'/');return}}}catch(e){}location.replace('/en/')})();`;

export default function RootPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: redirect }} />
      <p style={{ padding: 24 }}>
        <a href="/en/">English</a> · <a href="/fr/">Français</a> · <a href="/de/">Deutsch</a>
      </p>
    </>
  );
}
