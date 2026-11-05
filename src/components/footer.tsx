import { Arrow } from "./arrow";

export function Footer() {
  return (
    <footer className="site-footer site-footer-editorial page-gutter">
      <div className="footer-main">
        <a className="footer-wordmark" href="#top" aria-label="SIONA home">SIONA</a>
        <p className="footer-philosophy">The path is the way.</p>
        <p className="footer-context">Progress through connection, curiosity, and the capacity to evolve.</p>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Siona Group LLC. All rights reserved.</span>
        <span>Healthcare · Life sciences · Technology</span>
        <a className="back-to-top" href="#top">Back to top <Arrow /></a>
      </div>
    </footer>
  );
}
