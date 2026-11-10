import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Siona Practice Portal",
  robots: { index: false, follow: false },
  alternates: { canonical: undefined },
};
export const dynamic = "force-dynamic";
export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
