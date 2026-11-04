import { Arrow } from "./arrow";
import { BrandSymbol } from "./brand-symbol";

export function Hero() {
  return (
    <section className="hero page-gutter" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow hero-eyebrow">People. Technology. Healthcare.</p>
        <h1 id="hero-title">SIONA<span className="hero-period">.</span></h1>
        <p className="hero-philosophy">The path<br />is the way.</p>
        <a href="#about" className="explore-link">Discover Siona <Arrow direction="down" /></a>
      </div>
      <figure className="hero-art" aria-label="The SIONA symbol: a continuous, architectural fold">
        <div className="art-board">
          <div className="art-grid" aria-hidden="true" />
          <span className="registration registration-tl" aria-hidden="true" />
          <span className="registration registration-br" aria-hidden="true" />
          <span className="art-topline" aria-hidden="true">S — 01</span>
          <div className="sculpture">
            <BrandSymbol sculptural className="sculpture-symbol" />
          </div>
          <div className="art-baseline" aria-hidden="true"><span>One continuous form</span><Arrow /></div>
        </div>
        <figcaption><span>Form follows purpose.</span><span>SIONA GROUP</span></figcaption>
      </figure>
      <div className="hero-bottom" aria-hidden="true">
        <span>Siona Group LLC</span>
        <span className="hero-bottom-right"><span className="small-line" /> The path is the way</span>
      </div>
    </section>
  );
}
