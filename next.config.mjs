/** @type {import('next').NextConfig} */
const nextConfig = {
  // Eksport statyczny: `npm run build` tworzy folder `out/` z gotowymi plikami
  // do wgrania na zwykły hosting (np. SEOhost). Nie potrzeba Node.js na serwerze.
  output: "export",
  // /en/ -> out/en/index.html (zwykły hosting Apache serwuje to bez dodatkowych reguł)
  trailingSlash: true,
  images: {
    // przy eksporcie nie ma serwera do optymalizacji; zdjęcia i tak są już zoptymalizowane (WebP)
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
