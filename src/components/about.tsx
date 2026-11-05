export function About() {
  return (
    <section id="about" className="about-section page-gutter" aria-labelledby="about-title">
      <div className="section-label"><span className="section-number">01 /</span><h2 id="about-title">Our perspective</h2></div>
      <div className="about-content">
        <p className="about-statement">Progress is not a solitary achievement. It emerges through <span>connection, curiosity,</span> and the capacity to <span>evolve.</span></p>
        <div className="focus-areas" aria-label="Our guiding principles">
          <div><span>01</span><p>People</p></div>
          <div><span>02</span><p>Connections</p></div>
          <div><span>03</span><p>Evolution</p></div>
        </div>
      </div>
    </section>
  );
}
