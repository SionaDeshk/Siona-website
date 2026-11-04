import { ContactForm } from "./contact-form";

export function Contact() {
  return (
    <section id="contact" className="contact-section page-gutter" aria-labelledby="contact-title">
      <div className="contact-intro">
        <div className="section-label"><span className="section-number">02 /</span><h2 id="contact-title">Get in touch</h2></div>
        <p className="contact-heading">A conversation<br />starts <em>here.</em></p>
        <p className="contact-invitation">We welcome a thoughtful conversation.</p>
      </div>
      <ContactForm />
    </section>
  );
}
