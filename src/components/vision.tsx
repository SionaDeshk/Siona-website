import { SignalEngine } from "./signal-engine";

export function Vision() {
  return (
    <section
      id="vision"
      className="vision-section vision-neural page-gutter"
      aria-labelledby="vision-title"
    >
      <div className="section-label">
        <span className="section-number">04 /</span>
        <h2 id="vision-title">An evolving horizon</h2>
      </div>
      <div className="vision-neural-layout">
        <div className="vision-neural-copy">
          <p className="vision-headline">
            Built to <em>learn and evolve.</em>
          </p>
          <p className="vision-description">
            We want to make the connections between people, research, and
            institutions more useful. That starts with understanding a real
            need, checking the evidence, and building only where we can
            contribute.
          </p>
        </div>
        <figure
          className="vision-neural-field"
          aria-label="Illustrative neuron network with converging dendritic inputs, axonal signals and connected cell activation"
        >
          <SignalEngine variant="vision" />
          <figcaption>FIG. 03 / SIGNAL PROPAGATION</figcaption>
        </figure>
      </div>
      <div className="vision-neural-lower">
        <div className="horizon-steps" aria-label="Our direction">
          <div>
            <span>Understand</span>
            <p>
              Listen to clinicians, researchers, and institutional teams. Start
              with the problem they experience.
            </p>
          </div>
          <div>
            <span>Validate</span>
            <p>
              Test assumptions, examine documentation, and be clear about what
              remains unknown.
            </p>
          </div>
          <div>
            <span>Develop</span>
            <p>
              Turn credible evidence and responsible relationships into
              practical capabilities.
            </p>
          </div>
        </div>
        <p className="vision-note">
          A direction of travel, not a claim that future products or services
          are available today.
        </p>
      </div>
    </section>
  );
}
