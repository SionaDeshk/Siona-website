"use client";

import { useEffect, useRef, useState } from "react";
import { BrandSymbol } from "./brand-symbol";
import { Arrow } from "./arrow";

export function Header() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="site-header page-gutter">
      <a href="#top" aria-label="SIONA home" className="brand-lockup" onClick={() => setOpen(false)}>
        <BrandSymbol className="header-symbol" />
        <span>SIONA</span>
      </a>
      <nav aria-label="Main navigation" className="desktop-nav">
        <a href="#about" className="nav-link">About</a>
        <a href="#contact" className="nav-link contact-link">Get in touch <Arrow /></a>
      </nav>
      <button
        ref={menuButton}
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Close navigation" : "Open navigation"}
        onClick={() => setOpen(!open)}
      >
        <span>{open ? "Close" : "Menu"}</span>
        <span className={`menu-lines ${open ? "is-open" : ""}`} aria-hidden="true"><i /><i /></span>
      </button>
      <nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-nav" hidden={!open}>
        <a href="#about" onClick={() => setOpen(false)}>About <Arrow /></a>
        <a href="#contact" onClick={() => setOpen(false)}>Get in touch <Arrow /></a>
      </nav>
    </header>
  );
}
