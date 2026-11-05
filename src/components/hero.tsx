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
      <div className="hero-network hero-network-refined" aria-hidden="true">
        <svg viewBox="0 0 660 610" xmlns="http://www.w3.org/2000/svg" fill="none">
          <defs>
            <radialGradient id="neural-glow"><stop stopColor="#b8b99b" stopOpacity=".5"/><stop offset="1" stopColor="#b8b99b" stopOpacity="0"/></radialGradient>
            <linearGradient id="neural-line" x1="0" y1="0" x2="660" y2="610"><stop stopColor="#a6ac94" stopOpacity=".05"/><stop offset=".52" stopColor="#5e725f" stopOpacity=".8"/><stop offset="1" stopColor="#a6ac94" stopOpacity=".08"/></linearGradient>
          </defs>
          <circle cx="365" cy="310" r="245" fill="url(#neural-glow)"/>
          <g stroke="url(#neural-line)" strokeWidth="1.2" strokeLinecap="round">
            <path d="M60 430 L145 362 L234 398 L319 314 L405 343 L491 268 L598 303"/>
            <path d="M145 362 L171 248 L266 217 L319 314 L367 179 L491 268 L536 154"/>
            <path d="M234 398 L263 493 L405 449 L405 343 L506 427 L598 303"/>
            <path d="M171 248 L99 159 L266 217 L367 179 L410 84"/>
            <path d="M319 314 L266 217 M319 314 L405 449 M405 343 L367 179 M491 268 L506 427"/>
            <path d="M60 430 L110 520 M263 493 L224 568 M405 449 L460 546 M536 154 L605 90"/>
          </g>
          <g fill="#7c8a75"><circle cx="145" cy="362" r="3"/><circle cx="234" cy="398" r="2.5"/><circle cx="319" cy="314" r="5"/><circle cx="405" cy="343" r="3.5"/><circle cx="491" cy="268" r="4"/><circle cx="171" cy="248" r="2.5"/><circle cx="266" cy="217" r="3"/><circle cx="367" cy="179" r="2.5"/><circle cx="405" cy="449" r="3"/><circle cx="506" cy="427" r="2.5"/><circle cx="263" cy="493" r="2.5"/></g>
          <g fill="#c7b992"><circle cx="319" cy="314" r="9" opacity=".3"/><circle cx="491" cy="268" r="8" opacity=".25"/><circle cx="405" cy="343" r="7" opacity=".3"/></g>
        </svg>
        <span className="network-caption">Connections create possibility.</span>
      </div>
      <div className="hero-bottom" aria-hidden="true"><span>Siona Group LLC</span><span>The path is the way.</span></div>
    </section>
  );
}