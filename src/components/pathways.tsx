import { Arrow } from "./arrow";

export function Pathways() {
  return (
    <section
      id="pathways"
      className="pathways-section page-gutter"
      aria-labelledby="pathways-title"
    >
      <div className="section-label">
        <span className="section-number">03 /</span>
        <h2 id="pathways-title">Who we serve</h2>
      </div>
      <div className="pathways-grid">
        <article className="pathway-card">
          <span className="pathway-index">01 / THE CLINICAL COMMUNITY</span>
          <h3>
            For <em>clinicians.</em>
          </h3>
          <p>
            Clinicians looking for a clearer conversation about how they work.
            Tell us your specialty, practice preferences, and the conditions
            that help you do your best work.
          </p>
          <a href="#contact">
            Express interest <Arrow />
          </a>
        </article>
        <article className="pathway-card">
          <span className="pathway-index">02 / HEALTHCARE PARTNERS</span>
          <h3>
            For <em>organizations.</em>
          </h3>
          <p>
            Healthcare teams assessing workforce needs and future partnerships.
            We begin with your setting, clinical requirements, and the gaps you
            need to understand.
          </p>
          <a href="#contact">
            Discuss your needs <Arrow />
          </a>
        </article>
        <article className="pathway-card">
          <span className="pathway-index">03 / RESEARCH & MANUFACTURING</span>
          <h3>
            For <em>research partners.</em>
          </h3>
          <p>
            Research institutions and established manufacturers exploring supply
            relationships. Our focus is documentation, traceability, and a clear
            understanding of intended use.
          </p>
          <a href="/biologics">
            Explore Biologics <Arrow />
          </a>
        </article>
      </div>
      <p className="pathways-note">
        These are conversations we are developing, not a claim that placements,
        supply agreements, or products are available today.
      </p>
    </section>
  );
}
