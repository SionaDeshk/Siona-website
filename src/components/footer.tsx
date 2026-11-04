import { Arrow } from "./arrow";

export function Footer() {
  return (
    <footer className="site-footer page-gutter">
      <a className="footer-wordmark" href="#top" aria-label="SIONA home">SIONA</a>
      <p>© 2026 Siona Group LLC. All rights reserved.</p>
      <a className="back-to-top" href="#top">Back to top <Arrow /></a>
    </footer>
  );
}
