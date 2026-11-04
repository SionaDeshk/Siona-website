import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getSiteUrl, siteDescription } from "@/lib/site";
import "./globals.css";

const sans = localFont({
  src: "../../node_modules/@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "100 1000",
});
const serif = localFont({
  src: "../../node_modules/@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2",
  variable: "--font-serif",
  display: "swap",
  weight: "400",
  style: "italic",
});

const siteUrl = getSiteUrl();
export const metadata: Metadata = {
  title: "SIONA — The path is the way.",
  description: siteDescription,
  applicationName: "SIONA",
  metadataBase: siteUrl,
  alternates: siteUrl ? { canonical: "/" } : undefined,
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "SIONA — The path is the way.",
    description: siteDescription,
    siteName: "SIONA",
    ...(siteUrl ? { url: siteUrl } : {}),
  },
  twitter: { card: "summary_large_image", title: "SIONA — The path is the way.", description: siteDescription },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#f4f3ee" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body>
        <a className="skip-link" href="#main">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
