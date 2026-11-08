import type { Metadata } from "next";
import Link from "next/link";
import { BrandSymbol } from "@/components/brand-symbol";
export const metadata: Metadata = {
  title: "Siona Intelligence | From Signal to Action",
  description:
    "Research, interpretation, and opportunity analysis within the emerging Siona ecosystem.",
  robots: { index: false, follow: false },
};
export default function IntelligencePage() {
  return (
    <main className="intel-page">
      <header className="bio-header">
        <Link href="/" className="bio-brand">
          <BrandSymbol className="header-symbol" />
          SIONA
        </Link>
        <Link href="/" className="bio-back">
          Siona Group ↗
        </Link>
      </header>
      <section className="intel-hero">
        <span className="bio-kicker">
          SIONA INTELLIGENCE / CONCEPT IN DEVELOPMENT
        </span>
        <h1>
          See the signal.
          <br />
          <em>Shape what follows.</em>
        </h1>
        <p>
          Not another archive. A discipline for turning credible evidence into
          better questions, stronger relationships, and decisions worth making.
        </p>
        <a href="#analysis" className="bio-next-link">
          Explore our first analysis ↓
        </a>
      </section>
      <section className="intel-method">
        <span className="bio-kicker">HOW WE THINK</span>
        <div>
          <strong>01 / SIGNAL</strong>
          <strong>02 / INTERPRETATION</strong>
          <strong>03 / OPPORTUNITY</strong>
          <strong>04 / ACTION</strong>
        </div>
        <p>
          Every analysis asks what changed, why it matters, what could be done,
          and what evidence would change our assessment.
        </p>
      </section>
      <section className="intel-analysis" id="analysis">
        <span className="bio-kicker">ANALYSIS 001 / EXPLORATORY THESIS</span>
        <h2>What if the next breakthrough isn’t a molecule?</h2>
        <p className="intel-deck">
          A research-supply thesis: the opportunity between discovery and
          dependable delivery.
        </p>
        <div className="intel-analysis-grid">
          <article>
            <h3>The signal</h3>
            <p>
              Modern biologics depend on sophisticated development and
              manufacturing systems. FDA’s ICH Q13 guidance describes scientific
              and regulatory considerations for continuous manufacturing,
              including control strategies and lifecycle management.
            </p>
          </article>
          <article>
            <h3>Why it matters</h3>
            <p>
              Our hypothesis is that the quality of relationships, information,
              and supplier qualification can influence the reliability of
              research supply. This is a hypothesis to validate with actual
              buyers and manufacturers, not an established Siona finding.
            </p>
          </article>
          <article>
            <h3>What we’d test</h3>
            <p>
              Where do procurement delays arise? Which documentation gaps recur?
              What would institutions pay for improved visibility or continuity?
              Interviews and category-specific diligence would determine whether
              there is a viable opportunity.
            </p>
          </article>
          <article>
            <h3>What would change our mind</h3>
            <p>
              Evidence that existing suppliers already solve these problems
              adequately, that switching costs outweigh the benefits, or that
              compliance and unit economics make a new entrant impractical.
            </p>
          </article>
        </div>
        <p className="intel-source">
          Primary regulatory reference:{" "}
          <a
            href="https://www.fda.gov/regulatory-information/search-fda-guidance-documents/q13-continuous-manufacturing-drug-substances-and-drug-products"
            target="_blank"
            rel="noopener noreferrer"
          >
            FDA, ICH Q13, Continuous Manufacturing of Drug Substances and Drug
            Products (2023) ↗
          </a>
        </p>
        <p className="intel-note">
          Siona Intelligence is a proposed initiative of Siona Group, not yet a
          separate legal entity. This is original exploratory analysis, not
          peer-reviewed research, investment advice, or a claim of commercial
          traction.
        </p>
      </section>
      <section className="bio-next-cta">
        <span className="bio-kicker">THE NEXT QUESTION</span>
        <h2>
          What are we <em>missing?</em>
        </h2>
        <p>
          Strong ideas improve when challenged. We welcome informed perspectives
          from researchers, manufacturers, clinicians, and institutional
          partners.
        </p>
        <Link href="/#contact" className="bio-next-link">
          Join the conversation ↗
        </Link>
      </section>
      <footer className="bio-footer">
        <Link href="/" className="bio-brand">
          <BrandSymbol className="header-symbol" />
          SIONA
        </Link>
        <span>The path is the way.</span>
      </footer>
    </main>
  );
}
