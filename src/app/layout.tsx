import type { Metadata, Viewport } from "next";
import { Quicksand, Dancing_Script } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/Providers";
import { PwaSetup } from "@/components/pwa/PwaSetup";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  display: "swap",
});

const dancing = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Duet — Our Little Universe", template: "%s · Duet" },
  description:
    "A cozy shared space for two: memories, chat, games, plans and everything you love about each other.",
  applicationName: "Duet",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Duet",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Duet — Our Little Universe",
    description: "A cozy shared space for two.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#171122" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Applies the stored theme before first paint to avoid a flash. */
const themeInitScript = `
try {
  var t = localStorage.getItem("duet-theme") || "system";
  var dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  if (dark) document.documentElement.classList.add("dark");
} catch (e) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${quicksand.variable} ${dancing.variable} antialiased`}>
        <div className="romance-bg" aria-hidden />
        <Providers>
          {children}
          <PwaSetup />
        </Providers>
      </body>
    </html>
  );
}
