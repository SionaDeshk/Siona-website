"use client";
import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/commerce/model";
import {
  practiceOperationSchema,
  type PracticeData,
  type PracticeOperation,
  type PracticeQuote,
  type PracticeRequest,
} from "@/lib/practice/model";
import styles from "./workspace.module.css";
const when = (s: string) =>
  new Date(s.slice(0, 10) + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
export function PracticeCommerceDetails({
  data,
  request,
  preview,
  onPreview,
  onSaved,
}: {
  data: PracticeData;
  request: PracticeRequest;
  preview: boolean;
  onPreview: (op: PracticeOperation) => void;
  onSaved: () => Promise<void>;
}) {
  const [editor, setEditor] = useState<{
      quote: PracticeQuote;
      decision: "Accept" | "Decline";
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (editor) dialog.current?.showModal();
    else dialog.current?.close();
  }, [editor]);
  if (!data.commerce_ready) return null;
  const quotes = data.quotes?.filter((q) => q.request_id === request.id) || [],
    shipments =
      data.shipments?.filter((s) => s.request_id === request.id) || [],
    issues =
      data.issues?.filter(
        (i) => i.request_id === request.id && i.status === "Open",
      ) || [];
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || busy) return;
    const form = new FormData(event.currentTarget);
    const parsed = practiceOperationSchema.safeParse({
      action: "quote_decision",
      quote_id: editor.quote.id,
      quote_version: editor.quote.version,
      request_version: request.version,
      decision: editor.decision,
      confirmed: form.get("confirmed") === "on",
      notes:
        String(form.get("notes") || "").trim() ||
        (editor.decision === "Accept"
          ? "Practice accepted the quoted terms for coordination."
          : ""),
    });
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join(" "));
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (preview) onPreview(parsed.data);
      else {
        const response = await fetch("/api/practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(
            result.error || "Could not record the quote decision.",
          );
      }
      setEditor(null);
      if (!preview) await onSaved();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not record the decision.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={styles.commercial}>
      {issues.length > 0 && (
        <div className={styles.notice}>
          <strong>Follow-up needed</strong>
          {issues.map((i) => (
            <p key={i.id}>{i.practice_message}</p>
          ))}
        </div>
      )}
      {(quotes.length > 0 || request.quote_required) && <h3>Quoted terms</h3>}
      {quotes.map((q) => (
        <section
          key={q.id}
          className={styles.quote}
          aria-label="Practice quote"
        >
          <div className={styles.row}>
            <span className={styles.eyebrow}>
              QUOTE / {q.id.slice(-8).toUpperCase()}
            </span>
            <span className={styles.tag}>{q.status}</span>
          </div>
          <strong className={styles.quoteTotal}>
            {formatMoney(q.total_minor, q.currency)}
          </strong>
          <p>{q.practice_summary}</p>
          <dl className={styles.facts}>
            <div>
              <dt>Quantity</dt>
              <dd>
                {q.quantity} × {q.unit}
              </dd>
            </div>
            <div>
              <dt>Unit price</dt>
              <dd>{formatMoney(q.unit_minor, q.currency)}</dd>
            </div>
            <div>
              <dt>Shipping / tax</dt>
              <dd>
                {formatMoney(q.shipping_minor, q.currency)} /{" "}
                {formatMoney(q.tax_minor, q.currency)}
              </dd>
            </div>
            <div>
              <dt>Lead time</dt>
              <dd>{q.lead_days} days quoted</dd>
            </div>
            <div>
              <dt>Valid through</dt>
              <dd>{when(q.valid_until)}</dd>
            </div>
          </dl>
          <p>{q.delivery_terms}</p>
          {q.status === "Shared" &&
            !request.accepted_quote_id &&
            ["Review", "Hold"].includes(request.stage) && (
              <div className={styles.actions}>
                <button
                  className={styles.primary}
                  disabled={
                    data.role !== "requester" ||
                    q.valid_until < new Date().toISOString().slice(0, 10)
                  }
                  onClick={() => {
                    setError("");
                    setEditor({ quote: q, decision: "Accept" });
                  }}
                >
                  Accept quote for coordination
                </button>
                <button
                  disabled={data.role !== "requester"}
                  onClick={() => {
                    setError("");
                    setEditor({ quote: q, decision: "Decline" });
                  }}
                >
                  Decline quote
                </button>
              </div>
            )}
        </section>
      ))}
      {!quotes.length && request.quote_required && (
        <p>A reviewed quote will appear here before fulfillment.</p>
      )}
      {shipments.length > 0 && (
        <>
          <h3>Delivery progress</h3>
          {shipments.map((s) => (
            <section
              key={s.id}
              className={styles.quote}
              aria-label="Practice delivery"
            >
              <div className={styles.row}>
                <strong>{s.carrier || "Partner handoff"}</strong>
                <span className={styles.tag}>{s.status}</span>
              </div>
              <p>
                {s.quantity} request units · Expected {when(s.expected_on)}
              </p>
              <p>
                Tracking reference: {s.tracking_reference || "Not supplied"}
              </p>
              {data.lots
                ?.filter((l) => l.shipment_id === s.id)
                .map((l) => (
                  <p key={l.id}>
                    Lot {l.lot_code} · {l.quantity} units · Expires{" "}
                    {when(l.expires_on)}
                  </p>
                ))}
              <small>Progress recorded by Siona Operations.</small>
            </section>
          ))}
        </>
      )}
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="quote-decision-title"
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else setEditor(null);
        }}
        onClose={() => setEditor(null)}
      >
        {editor && (
          <form onSubmit={save}>
            <div className={styles.row}>
              <span className={styles.eyebrow}>SIONA / QUOTE DECISION</span>
              <button
                type="button"
                disabled={busy}
                aria-label="Close quote decision"
                onClick={() => setEditor(null)}
              >
                ×
              </button>
            </div>
            <h2 id="quote-decision-title">
              {editor.decision === "Accept"
                ? "Accept quoted terms"
                : "Decline quoted terms"}
            </h2>
            <strong className={styles.quoteTotal}>
              {formatMoney(editor.quote.total_minor, editor.quote.currency)}
            </strong>
            <p>
              {editor.quote.quantity} × {editor.quote.unit} ·{" "}
              {editor.quote.lead_days} days quoted lead time
            </p>
            <p>{editor.quote.delivery_terms}</p>
            <p>
              Acceptance records your commercial decision for coordination.
              Payment and purchasing are handled through the agreed partner
              process.
            </p>
            {error && (
              <p role="alert" className={styles.notice}>
                {error}
              </p>
            )}
            <fieldset disabled={busy}>
              {editor.decision === "Accept" && (
                <label className={styles.confirmation}>
                  <input type="checkbox" name="confirmed" required />I accept
                  these quoted terms for coordination.
                </label>
              )}
              <label>
                {editor.decision === "Accept"
                  ? "Business note (optional)"
                  : "Reason for declining"}
                <textarea
                  name="notes"
                  rows={3}
                  required={editor.decision === "Decline"}
                  minLength={editor.decision === "Decline" ? 10 : undefined}
                  maxLength={1000}
                />
              </label>
            </fieldset>
            <div className={styles.actions}>
              <button className={styles.primary} disabled={busy}>
                {busy
                  ? "Saving…"
                  : preview
                    ? "Save decision in preview"
                    : editor.decision === "Accept"
                      ? "Confirm acceptance"
                      : "Confirm decline"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditor(null)}
              >
                Back
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}
