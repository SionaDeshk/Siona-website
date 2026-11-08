import { Arrow } from "@/components/arrow";
import { SignalEngine } from "@/components/signal-engine";
import type { Metadata } from "next";
import Link from "next/link";
import { BrandSymbol } from "@/components/brand-symbol";
export const metadata: Metadata = {
  title: "Siona Biologics | The Next Frontier",
  description:
    "Exploring research supply and the next generation of life-sciences infrastructure.",
  robots: { index: false, follow: false },
};
export default function BiologicsPage() {
  return (
    <main className="ia-bio">
      <header className="ia-subnav">
        <Link href="/" className="ia-subbrand">
          <BrandSymbol className="header-symbol" /> SIONA
        </Link>
        <Link href="/">← GROUP</Link>
      </header>
      <section className="ia-bio-hero">
        <SignalEngine variant="bio" />
        <div className="ia-bio-content">
          <span className="ia-index">SIONA / BIOLOGICS / IN DEVELOPMENT</span>
          <h1>
            Life sciences.
            <br />
            <em>Without limits.</em>
          </h1>
          <p>
            Building the relationships and intelligence that could reshape how
            research moves forward.
          </p>
          <a href="#bio-focus">Explore the frontier ↓</a>
        </div>
        <span className="ia-bio-coordinate">FIG. 01 / EMERGENCE</span>
      </section>
      <section className="ia-bio-focus" id="bio-focus">
        <div className="ia-section-top">
          <span className="ia-index">01 / OUR DIRECTION</span>
          <h2>
            From discovery
            <br />
            to possibility.
          </h2>
        </div>
        <div className="ia-bio-cards">
          <article>
            <span>01 / CONNECTION</span>
            <h3>Research supply</h3>
            <p>
              Explore relationships between qualified institutions and
              established manufacturers.
            </p>
          </article>
          <article>
            <span>02 / CONFIDENCE</span>
            <h3>Quality & trust</h3>
            <p>
              Put traceability, documentation, and fit-for-purpose diligence at
              the center.
            </p>
          </article>
          <article>
            <span>03 / EVOLUTION</span>
            <h3>What comes next</h3>
            <p>
              Investigate emerging technologies and production pathways as
              capabilities mature.
            </p>
          </article>
        </div>
      </section>
      <section className="ia-bio-analysis">
        <span className="ia-index">FEATURED / SIONA INTELLIGENCE</span>
        <h2>
          What if the next breakthrough
          <br />
          isn’t a molecule?
        </h2>
        <p>
          A closer look at the systems connecting research, manufacturing, and
          supply.
        </p>
        <Link href="/intelligence#analysis">Read the analysis <Arrow /></Link>
      </section>
      <section className="ia-bio-contact">
        <span className="ia-index">02 / COLLABORATE</span>
        <h2>
          Let’s explore
          <br />
          <em>what’s possible.</em>
        </h2>
        <p>
          Siona Biologics is an initiative in development. We welcome
          exploratory discussions with qualified research organizations and
          established manufacturers. No products are currently offered for sale.
        </p>
        <Link href="/#contact">Start a conversation <Arrow /></Link>
      </section>
      <footer className="ia-subfooter">
        <span>SIONA GROUP LLC</span>
        <span>THE PATH IS THE WAY.</span>
      </footer>
    </main>
  );
}
