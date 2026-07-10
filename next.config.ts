import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Allow the app to keep its reference to popups it opens (e.g. the
        // Firebase Google sign-in popup). Without this, some environments apply
        // a `same-origin` COOP that severs the opener↔popup link and breaks
        // signInWithPopup ("Cross-Origin-Opener-Policy would block the
        // window.closed call").
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;
