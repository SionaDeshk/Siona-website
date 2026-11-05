import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Siona Biologics | Institutional Research Supply",
  description: "An emerging concept exploring responsible life-sciences supply and research partnerships.",
  robots: { index: false, follow: false },
};

const pillars = [
  { number: "01", title: "Research supply", body: "Explore sourcing of legitimate laboratory reagents and research consumables for qualified institutional customers." },
  { number: "02", title: "Quality by design", body: "Build around supplier qualification, lot traceability, fit-for-purpose testing, and transparent documentation." },
  { number: "03", title: "Future pathways", body: "Evaluate peptide research, analytical services, and broader biotechnology partnerships as the business develops." },
];

export default function BiologicsPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f6f2e9", color: "#242625" }}>
      <div style={{ padding: "28px clamp(24px, 6vw, 100px)", borderBottom: "1px solid #d9d1c2", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20 }}>
        <Link href="/" style={{ fontSize: 20, letterSpacing: ".16em", fontWeight: 600 }}>SIONA</Link>
        <Link href="/" style={{ fontSize: 12, textDecoration: "underline", textUnderlineOffset: 5 }}>Back to Siona Group</Link>
      </div>
      <section style={{ padding: "clamp(70px, 10vw, 150px) clamp(24px, 6vw, 100px) 90px", maxWidth: 1250 }}>
        <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".2em", color: "#6b7063" }}>Siona Group / Emerging concept</p>
        <h1 style={{ fontSize: "clamp(54px, 9vw, 132px)", fontWeight: 400, letterSpacing: "-.065em", lineHeight: 1.03, margin: "32px 0" }}>Siona <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>Biologics.</span></h1>
        <p style={{ fontSize: "clamp(20px, 2.5vw, 34px)", lineHeight: 1.35, maxWidth: 780, letterSpacing: "-.025em" }}>A future-facing life-sciences initiative grounded in scientific integrity, transparent supply chains, and responsible innovation.</p>
        <p style={{ fontSize: 13, color: "#68695f", marginTop: 36, maxWidth: 670, lineHeight: 1.9 }}>This is an exploratory business concept, not an operating pharmaceutical manufacturer, licensed distributor, or currently available product storefront.</p>
      </section>
      <section style={{ background: "#e9e3d7", padding: "70px clamp(24px, 6vw, 100px)" }}>
        <p style={{ fontSize: 11, letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 32 }}>Areas under exploration</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 30 }}>
          {pillars.map((p) => <article key={p.number} style={{ borderTop: "1px solid #b6b2a5", paddingTop: 20 }}>
            <span style={{ fontSize: 11, color: "#68695f" }}>{p.number} /</span>
            <h2 style={{ fontSize: 27, fontWeight: 400, margin: "24px 0 14px" }}>{p.title}</h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: "#555950" }}>{p.body}</p>
          </article>)}
        </div>
      </section>
      <section aria-labelledby="biologics-inquiries" style={{ padding: "64px clamp(24px, 6vw, 100px)", borderTop: "1px solid #d9d1c2" }}>
        <p style={{ fontSize: 11, letterSpacing: ".15em", textTransform: "uppercase", color: "#6b7063" }}>Institutional relationships</p>
        <h2 id="biologics-inquiries" style={{ fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 400, letterSpacing: "-.04em", margin: "20px 0" }}>Let's explore what's possible.</h2>
        <p style={{ fontSize: 15, lineHeight: 1.9, maxWidth: 680, color: "#555950" }}>We welcome introductory conversations with established manufacturers, accredited laboratories, and qualified research organizations interested in responsible life-sciences supply. This is an expression-of-interest channel only, not an offer to sell or a request for orders.</p>
        <Link href="/#contact" style={{ display: "inline-block", borderBottom: "1px solid currentColor", marginTop: 20, paddingBottom: 8, fontSize: 13 }}>Introduce your organization ↗</Link>
      </section>
      <section style={{ padding: "70px clamp(24px, 6vw, 100px)", maxWidth: 900 }}>
        <h2 style={{ fontSize: "clamp(32px, 4vw, 55px)", fontWeight: 400, letterSpacing: "-.04em" }}>Built for what comes next.</h2>
        <p style={{ fontSize: 15, lineHeight: 1.9, color: "#555950" }}>Any commercial offering would be subject to supplier diligence, appropriate regulatory review, and brand clearance. No investigational injectable products are offered for sale.</p>
        <Link href="/#contact" style={{ display: "inline-block", marginTop: 18, borderBottom: "1px solid currentColor", paddingBottom: 8, fontSize: 13 }}>Contact Siona Group ↗</Link>
      </section>
    </main>
  );
}
