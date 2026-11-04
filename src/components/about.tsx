export function About() {
  return (
    <section id="about" className="about-section page-gutter" aria-labelledby="about-title">
      <div className="section-label"><span className="section-number">01 /</span><h2 id="about-title">About Siona</h2></div>
      <div className="about-content">
        <p className="about-statement">Siona Group is focused on <span>people, technology,</span> and the future of <span>healthcare.</span></p>
        <div className="focus-areas" aria-label="Our focus">
          <div><span>01</span><p>People</p></div>
          <div><span>02</span><p>Technology</p></div>
          <div><span>03</span><p>Healthcare</p></div>
        </div>
      </div>
    </section>
  );
}
