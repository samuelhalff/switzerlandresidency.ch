import type { ReactNode } from "react";

/** Minimal root layout for "/" only (Apache normally redirects before this is served). */
export default function RootRedirectLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta httpEquiv="refresh" content="0; url=/en/" />
      </head>
      <body style={{ background: "#f7f1e8", color: "#2b2a27", fontFamily: "system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
