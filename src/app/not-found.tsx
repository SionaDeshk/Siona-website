import Link from "next/link";
import { BrandSymbol } from "@/components/brand-symbol";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center gap-7 px-6 text-center">
      <BrandSymbol className="w-14 text-olive" />
      <p className="text-xs tracking-widest uppercase">404 — Page not found</p>
      <h1 className="text-4xl tracking-tight">Find your way back.</h1>
      <Link href="/" className="border-b border-ink pb-2 text-sm mt-4">Return to SIONA ↗</Link>
    </main>
  );
}
