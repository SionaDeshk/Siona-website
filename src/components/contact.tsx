import { ContactForm } from "./contact-form";

export function Contact() {
  return (
    <section id="contact" className="contact-section page-gutter" aria-labelledby="contact-title">
      <div className="contact-intro">
        <div className="section-label"><span className="section-number">06 /</span><h2 id="contact-title">Get in touch</h2></div>
        <p className="contact-heading">A conversation<br />starts <em>here.</em></p>
        <p className="contact-invitation">Clinician, healthcare organization, or future collaborator? Tell us what brings you here. Siona is currently in its early stages.</p>
      </div>
      <ContactForm />
    </section>
  );
}
