/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // Lets us render a real /404.html even though there is no single root layout
    // (each locale has its own <html lang>).
    globalNotFound: true,
  },
};

export default nextConfig;
