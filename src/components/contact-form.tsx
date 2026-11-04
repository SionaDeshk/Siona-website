"use client";

import { useEffect, useRef, useState } from "react";
import { Arrow } from "./arrow";
import { contactSchema, type ContactErrors, type ContactFields } from "@/lib/contact-schema";

type Challenge = { token: string; readyAt: number };

async function getChallenge(signal?: AbortSignal): Promise<Challenge> {
  const response = await fetch("/api/contact", { cache: "no-store", signal });
  if (!response.ok) throw new Error("Contact is temporarily unavailable. Please try again shortly.");
  return response.json();
}

export function ContactForm() {
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");
  const challenge = useRef<Challenge | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const sending = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    getChallenge(controller.signal).then(value => { challenge.current = value; }).catch(() => {
      // Retry on submission; a transient prefetch failure should not block writing.
    });
    return () => controller.abort();
  }, []);

  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) return;
    const data = new FormData(event.currentTarget);
    const result = contactSchema.safeParse(Object.fromEntries(data));
    if (!result.success) {
      const nextErrors: ContactErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ContactFields;
        nextErrors[field] ??= issue.message;
      }
      setErrors(nextErrors);
      setStatus("idle");
      setFeedback("");
      formRef.current?.querySelector<HTMLInputElement>(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }
    sending.current = true;
    setErrors({});
    setStatus("sending");
    setFeedback("");
    try {
      const current = challenge.current ?? await getChallenge();
      const wait = Math.max(0, current.readyAt - Date.now());
      if (wait) await new Promise(resolve => setTimeout(resolve, Math.min(wait, 3000)));
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...result.data, website: data.get("website") ?? "", token: current.token }),
        signal: AbortSignal.timeout(20000),
      });
      const body: { message?: string } = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Your message could not be sent. Please try again.");
      setStatus("success");
      setFeedback("Thank you for reaching out. Your message has been sent.");
      formRef.current?.reset();
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error && error.name !== "TimeoutError" ? error.message : "The request took too long. Please wait a moment before trying again.");
    } finally {
      sending.current = false;
      challenge.current = null;
      getChallenge().then(value => { challenge.current = value; }).catch(() => {});
    }
  }

  if (status === "success") {
    return (
      <div className="contact-success" role="status" aria-live="polite">
        <span className="success-icon" aria-hidden="true">✓</span>
        <h3 tabIndex={-1} ref={node => { node?.focus(); }}>Message received.</h3>
        <p>{feedback}</p>
        <button type="button" className="text-button" onClick={() => { setStatus("idle"); setFeedback(""); }}>Send another message <Arrow direction="right" /></button>
      </div>
    );
  }

  const fieldProps = (name: keyof ContactFields) => ({
    id: name,
    name,
    "aria-invalid": errors[name] ? true as const : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form ref={formRef} onSubmit={submit} method="post" action="/api/contact" noValidate className="contact-form" aria-label="Contact Siona" aria-busy={status === "sending"}>
      <div className="form-pair">
        <div className="form-field">
          <label htmlFor="name">Name <span>(required)</span></label>
          <input {...fieldProps("name")} placeholder="Your name" autoComplete="name" required minLength={2} maxLength={100} />
          {errors.name && <p id="name-error" className="field-error">{errors.name}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="email">Email <span>(required)</span></label>
          <input {...fieldProps("email")} type="email" placeholder="you@example.com" autoComplete="email" required maxLength={254} />
          {errors.email && <p id="email-error" className="field-error">{errors.email}</p>}
        </div>
      </div>
      <div className="form-field message-field">
        <label htmlFor="message">Message <span>(required)</span></label>
        <textarea {...fieldProps("message")} placeholder="What would you like to share?" rows={3} required minLength={10} maxLength={5000} />
        {errors.message && <p id="message-error" className="field-error">{errors.message}</p>}
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="form-actions">
        <p>Your details are used only to<br className="desktop-break" /> respond to your message.</p>
        <button className="submit-button" type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send message"}<Arrow />
        </button>
      </div>
      <p className="form-feedback" role="status" aria-live="polite">{feedback}</p>
      <noscript><p className="field-error">Please enable JavaScript to use this contact form.</p></noscript>
    </form>
  );
}
