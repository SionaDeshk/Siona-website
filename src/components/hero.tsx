import { Arrow } from "./arrow";

export function Hero() {
  return (
    <section className="hero hero-manifesto page-gutter" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow hero-eyebrow">Siona Group / An evolving enterprise</p>
        <h1 id="hero-title">Creating the conditions for <em>what comes next.</em></h1>
        <p className="hero-introduction">Connecting people, institutions, and ideas across healthcare, life sciences, and emerging technology.</p>
        <a href="#about" className="explore-link">Discover our approach <Arrow direction="down" /></a>
      </div>
      <div className="hero-network" aria-hidden="true">
        <svg viewBox="0 0 660 610" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g className="network-paths" stroke="currentColor" strokeWidth="1">
            <path d="M-20 425 C 160 400, 176 220, 340 300 S 530 470, 700 120"/>
            <path d="M-20 480 C 120 430, 215 340, 340 300 S 560 230, 700 360"/>
            <path d="M-20 335 C 135 330, 205 120, 340 300 S 535 390, 700 530"/>
            <path d="M65 620 C 175 470, 180 380, 340 300 S 510 115, 590 -20"/>
            <path d="M235 620 C 280 485, 275 405, 340 300 S 385 135, 415 -20"/>
            <path d="M490 620 C 435 485, 390 390, 340 300 S 235 120, 180 -20"/>
            <path d="M700 455 C 545 420, 465 340, 340 300 S 130 205, -20 105"/>
          </g>
          <g fill="currentColor">
            <circle cx="340" cy="300" r="4"/><circle cx="160" cy="342" r="3"/><circle cx="480" cy="335" r="3"/><circle cx="251" cy="191" r="2.5"/><circle cx="422" cy="201" r="2.5"/><circle cx="550" cy="421" r="2.5"/>
          </g>
        </svg>
        <span className="network-caption">Connections create possibility.</span>
      </div>
      <div className="hero-bottom" aria-hidden="true"><span>Siona Group LLC</span><span>The path is the way.</span></div>
    </section>
  );
}
