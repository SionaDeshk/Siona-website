import { Arrow } from "./arrow";
import { LivingNetwork } from "./living-network";
export function Hero() {
  return (
    <section className="hero hero-manifesto page-gutter" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow hero-eyebrow">Siona Group / An evolving enterprise</p>
        <h1 id="hero-title">Creating the conditions for <em>what comes next.</em></h1>
        <p className="hero-introduction">Connecting people, institutions, and ideas across healthcare, life sciences, and emerging technology.</p>
        <a href="#about" className="explore-link">Discover our approach <Arrow direction="down" /></a>
      </div>
      <LivingNetwork />
      <div className="hero-bottom" aria-hidden="true"><span>Siona Group LLC</span><span>The path is the way.</span></div>
    </section>
  );
}