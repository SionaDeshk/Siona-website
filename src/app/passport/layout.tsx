import type { Metadata } from "next";
import "./passport.css";
export const metadata: Metadata = {
  title: "Siona Passport",
  robots: { index: false, follow: false },
  alternates: { canonical: "/passport" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className="passport">{children}</div>;
}
