import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Siona Evolution Engine",
  robots: { index: false, follow: false },
  alternates: { canonical: undefined },
};
export const dynamic = "force-dynamic";
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
