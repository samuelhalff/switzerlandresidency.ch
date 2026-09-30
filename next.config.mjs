/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  // Stable build id: Next's default is random per build, which changes every HTML/RSC file and
  // defeats the incremental deploy (scripts/deploy-ftp.py). Real changes still show up through
  // content-hashed chunk names.
  generateBuildId: async () => "static",
  experimental: {
    // Lets us render a real /404.html even though there is no single root layout
    // (each locale has its own <html lang>).
    globalNotFound: true,
  },
};

export default nextConfig;
