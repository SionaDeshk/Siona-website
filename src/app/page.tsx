import { Arrow } from "@/components/arrow";
import Link from "next/link";
import { Header } from "@/components/header";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";
import { Pathways } from "@/components/pathways";
import { Vision } from "@/components/vision";
import { SignalEngine } from "@/components/signal-engine";

const divisions = [
  {
    id: "01",
    title: "Healthcare",
    category: "PEOPLE / SYSTEMS",
    description:
      "Clinician-centered relationships and a more transparent approach to workforce infrastructure.",
    href: "#contact",
    cta: "Start a conversation",
  },
  {
    id: "02",
    title: "Biologics",
    category: "LIFE SCIENCES / SUPPLY",
    description:
      "Exploring qualified research supply, trusted manufacturing relationships, and future capabilities.",
    href: "/biologics",
    cta: "Explore Biologics",
  },
  {
    id: "03",
    title: "Intelligence",
    category: "SIGNALS / DECISIONS",
    description:
      "Research that identifies change, tests assumptions, and informs the next opportunity.",
    href: "/intelligence",
    cta: "Explore Intelligence",
  },
];
export default function Home() {
  return (
    <div id="top" className="ia-shell">
      <Header />
      <main id="main">
        <section className="ia-hero">
          <SignalEngine />
          <div className="ia-hero-content">
            <div className="ia-overline">
              <span className="ia-pulse" />
              SIONA GROUP{" "}
              <span className="ia-overline-right">INDEPENDENT / EVOLVING</span>
            </div>
            <h1>
              Building
              <br />
              <em>what’s next.</em>
            </h1>
            <p>Healthcare. Life sciences. Intelligence.</p>
            <div className="ia-actions">
              <a href="#ventures">
                Explore Siona <Arrow direction="down" />
              </a>
              <a href="#contact">
                Connect with us <Arrow />
              </a>
            </div>
          </div>
          <div className="ia-hero-bottom">
            <span>THE PATH IS THE WAY.</span>
            <span>SCROLL TO DISCOVER ↓</span>
          </div>
        </section>
        <section className="ia-thesis ia-approach" id="about">
          <span className="ia-index">00 / THE APPROACH</span>
          <div className="ia-approach-layout">
            <div className="ia-approach-copy">
              <h2>
                See further.
                <br />
                Connect better.
                <br />
                <em>Build deliberately.</em>
              </h2>
              <p>
                We develop ideas at the intersection of people, science, and
                emerging technology. Each venture begins with a real problem and
                a reason to solve it.
              </p>
            </div>
            <figure
              className="ia-approach-field"
              aria-label="Three interconnected flows illustrating the connection between people, science and technology"
            >
              <SignalEngine variant="approach" />
              <figcaption>PEOPLE / SCIENCE / TECHNOLOGY</figcaption>
            </figure>
          </div>
        </section>
        <section className="ia-ventures" id="ventures">
          <div className="ia-section-top">
            <span className="ia-index">01 / OUR FOCUS</span>
            <h2>Connected by design.</h2>
          </div>
          <div className="ia-venture-list">
            {divisions.map((d) => (
              <Link className="ia-venture" href={d.href} key={d.id}>
                <span className="ia-venture-id">{d.id}</span>
                <div>
                  <span className="ia-venture-category">{d.category}</span>
                  <h3>{d.title}</h3>
                </div>
                <p>{d.description}</p>
                <span className="ia-venture-arrow" aria-label={d.cta}>
                  <Arrow />
                </span>
              </Link>
            ))}
          </div>
        </section>
        <Pathways />
        <Vision />
        <section className="ia-closing">
          <span className="ia-index">02 / THE HORIZON</span>
          <h2>
            Opportunity doesn’t
            <br />
            stand still. <em>Neither do we.</em>
          </h2>
          <Link href="/intelligence">
            Explore our thinking <Arrow />
          </Link>
        </section>
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
