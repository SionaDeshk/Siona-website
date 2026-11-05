import { Arrow } from "./arrow";

export function Pathways() {
  return (
    <section id="pathways" className="pathways-section page-gutter" aria-labelledby="pathways-title">
      <div className="section-label"><span className="section-number">03 /</span><h2 id="pathways-title">Connect with Siona</h2></div>
      <div className="pathways-grid">
        <article className="pathway-card">
          <span className="pathway-index">01 / THE CLINICAL COMMUNITY</span>
          <h3>For <em>clinicians.</em></h3>
          <p>Be part of an emerging network centered on professional autonomy, transparency, and opportunity.</p>
          <a href="#contact">Express interest <Arrow /></a>
        </article>
        <article className="pathway-card">
          <span className="pathway-index">02 / HEALTHCARE PARTNERS</span>
          <h3>For <em>organizations.</em></h3>
          <p>Start a conversation about future workforce partnerships and clinician-centered staffing solutions.</p>
          <a href="#contact">Start a conversation <Arrow /></a>
        </article>
      </div>
      <p style={{ marginTop: 28, fontSize: 14, lineHeight: 1.7 }}>Exploring institutional research supply? <a href="/biologics" style={{ textDecoration: "underline", textUnderlineOffset: 4 }}>Discover Siona Biologics <Arrow /></a></p>
    </section>
  );
}
