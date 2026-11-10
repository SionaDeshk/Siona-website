"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandSymbol } from "@/components/brand-symbol";
import {
  commerceOperationSchema,
  formatMoney,
  type CommerceData,
  type CommerceRequest,
  type Currency,
} from "@/lib/commerce/model";
import { rehearseCommerce } from "@/lib/commerce/demo";
import type { OperationsData } from "@/lib/operations/model";
import { fieldsFor, payloadFromForm, titles, type Editor } from "./forms";
import shell from "@/components/operations/workspace.module.css";
import styles from "./workspace.module.css";
const when = (s: string) =>
  new Date(s.slice(0, 10) + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
async function load() {
  const responses = await Promise.all([
    fetch("/api/commerce", { cache: "no-store" }),
    fetch("/api/operations", { cache: "no-store" }),
  ]);
  const [data, core] = await Promise.all(responses.map((r) => r.json()));
  if (!responses[0].ok) throw new Error(data.error);
  if (!responses[1].ok) throw new Error(core.error);
  return { data: data as CommerceData, core: core as OperationsData };
}
export function CommerceWorkspace({
  role,
  displayName,
  signOut,
  initialRequest,
  previewData,
}: {
  role: string;
  displayName: string;
  signOut?: () => Promise<void>;
  initialRequest?: string;
  previewData?: { data: CommerceData; core: OperationsData };
}) {
  const [state, setState] = useState(previewData || null),
    [loading, setLoading] = useState(!previewData),
    [error, setError] = useState("");
  const [tab, setTab] = useState("Quotes"),
    [selected, setSelected] = useState(
      initialRequest || previewData?.data.requests[0]?.id || "",
    );
  const [editor, setEditor] = useState<Editor | null>(null),
    [busy, setBusy] = useState(false),
    [formError, setFormError] = useState(""),
    [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    preview = !!previewData,
    writer = role !== "viewer",
    admin = role === "admin";
  useEffect(() => {
    if (preview) return;
    let cancelled = false;
    load()
      .then((data) => {
        if (!cancelled) setState(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [preview]);
  useEffect(() => {
    if (editor) dialog.current?.showModal();
    else dialog.current?.close();
  }, [editor]);
  const data = state?.data,
    core = state?.core,
    current =
      data?.requests.find((r) => r.id === selected) || data?.requests[0];
  const name = (r: CommerceRequest) =>
    core?.products.find((p) => p.id === r.product_id)?.name || "Product record";
  const practice = (r: CommerceRequest) =>
    core?.practices.find((p) => p.id === r.practice_id)?.legal_name ||
    "Internal channel planning";
  const requestLabel = (r?: CommerceRequest) =>
    r
      ? name(r) + " · " + practice(r) + " · " + r.id.slice(-6).toUpperCase()
      : "Request outside this view";
  function open(action: Editor["action"], record?: object, request = current) {
    setFormError("");
    setEditor({
      action,
      record: record as Record<string, unknown> | undefined,
      request,
    });
  }
  const can = (action: Editor["action"]) =>
    writer &&
    (!["quote_status", "internal_accept", "recall", "close_recall"].includes(
      action,
    ) ||
      admin);
  const button = (
    text: string,
    action: Editor["action"],
    record?: object,
    request = current,
  ) => (
    <button
      disabled={!can(action)}
      onClick={() => open(action, record, request)}
    >
      {text}
    </button>
  );
  async function refresh() {
    try {
      setState(await load());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed.");
    }
  }
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || !state || busy) return;
    setFormError("");
    try {
      const parsed = commerceOperationSchema.safeParse(
        payloadFromForm(
          editor,
          new FormData(event.currentTarget),
          fieldsFor(editor, state.data, state.core),
        ),
      );
      if (!parsed.success) {
        setFormError(
          parsed.error.issues
            .map((i) => i.path.join(".") + ": " + i.message)
            .join("; "),
        );
        return;
      }
      setBusy(true);
      if (preview)
        setState({ ...state, data: rehearseCommerce(state.data, parsed.data) });
      else {
        const response = await fetch("/api/commerce", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error || "Could not save the record.");
      }
      setEditor(null);
      setNotice(
        preview
          ? "Preview updated. Changes stay in this tab."
          : "Saved to the supply desk.",
      );
      if (!preview) await refresh();
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : "Could not save the record.",
      );
    } finally {
      setBusy(false);
    }
  }
  const quotes = data?.quotes.filter((q) => q.request_id === current?.id) || [],
    shipments =
      data?.shipments.filter((s) => s.request_id === current?.id) || [];
  return (
    <main id="main" className={shell.root + " " + styles.desk}>
      <aside className={shell.sidebar}>
        <Link href="/" className={shell.brand}>
          <BrandSymbol />
          <span>
            SIONA<small>SUPPLY DESK</small>
          </span>
        </Link>
        <div className={shell.workspaceLabel}>QUOTES / FULFILLMENT</div>
        <nav aria-label="Supply desk">
          {["Quotes", "Fulfillment", "Follow-ups"].map((name, i) => (
            <button
              key={name}
              aria-current={tab === name ? "page" : undefined}
              onClick={() => setTab(name)}
            >
              <span>0{i + 1}</span>
              {name}
            </button>
          ))}
        </nav>
        <div className={shell.sidebarBottom}>
          <Link href="/workspace/operations">Operations workspace →</Link>
          <p>
            {displayName}
            <small>{role} access</small>
          </p>
          {signOut && (
            <form action={signOut}>
              <button>Sign out</button>
            </form>
          )}
        </div>
      </aside>
      <div className={shell.main}>
        <header className={shell.topbar}>
          <span>SIONA / COMMERCIAL COORDINATION</span>
          <div>
            {preview ? "LOCAL REHEARSAL" : "PRIVATE WORKSPACE"}
            {signOut && (
              <form action={signOut}>
                <button>Sign out</button>
              </form>
            )}
          </div>
        </header>
        {preview && (
          <div className={shell.preview}>
            <strong>Interactive supply preview · fictional records</strong>
            <span>
              Amounts, partners and events are fictional. Changes stay in this
              tab.
            </span>
          </div>
        )}
        <div className={shell.content}>
          <div className={shell.heading}>
            <div>
              <span className={shell.eyebrow}>
                SUPPLY DESK / {tab.toUpperCase()}
              </span>
              <h1>
                {tab === "Quotes" ? (
                  <>
                    From quote
                    <br />
                    to <em>delivery.</em>
                  </>
                ) : (
                  tab
                )}
              </h1>
              <p>
                {tab === "Quotes"
                  ? "Reviewed terms, explicit acceptance, and a documented next step."
                  : tab === "Fulfillment"
                    ? "Partner handoffs, physical traceability, and observed delivery progress."
                    : "Keep delivery exceptions and lot follow-ups visible through resolution."}
              </p>
            </div>
            {!preview && (
              <button onClick={() => void refresh()}>Refresh records</button>
            )}
          </div>
          <p role="status" className={shell.feedback}>
            {notice}
          </p>
          {error && (
            <div className={shell.attention} role="alert">
              <h2>Supply desk is unavailable</h2>
              <p>{error}</p>
              <button onClick={() => void refresh()}>Try again</button>
              <Link href="/workspace/operations">Open Operations →</Link>
            </div>
          )}
          {loading ? (
            <p role="status">Loading quotes and fulfillment…</p>
          ) : (
            state &&
            !error && (
              <>
                {data?.truncated && (
                  <p className={shell.attention}>
                    Showing up to 500 records per category. Request the archive
                    before reconciling larger datasets.
                  </p>
                )}
                <div className={shell.metrics}>
                  {[
                    [
                      "Shared quotes",
                      data!.quotes.filter((q) => q.status === "Shared").length,
                    ],
                    [
                      "Accepted quotes",
                      data!.quotes.filter((q) => q.status === "Accepted")
                        .length,
                    ],
                    [
                      "Active handoffs",
                      data!.shipments.filter(
                        (s) => !["Delivered", "Cancelled"].includes(s.status),
                      ).length,
                    ],
                    [
                      "Open follow-ups",
                      data!.issues.filter((i) => i.status === "Open").length,
                    ],
                  ].map(([label, value]) => (
                    <article key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </article>
                  ))}
                </div>
                {tab !== "Follow-ups" && (
                  <div className={shell.toolbar}>
                    <label>
                      Coordination request
                      <select
                        value={current?.id || ""}
                        onChange={(e) => setSelected(e.target.value)}
                      >
                        {data!.requests.map((r) => (
                          <option key={r.id} value={r.id}>
                            {requestLabel(r)}
                          </option>
                        ))}
                      </select>
                    </label>
                    {current && (
                      <span className={shell.status}>{current.stage}</span>
                    )}
                  </div>
                )}
                {current && tab !== "Follow-ups" && (
                  <section className={shell.panel + " " + styles.summary}>
                    <div>
                      <span className={shell.eyebrow}>
                        {current.channel} / {current.state}
                      </span>
                      <h2>{name(current)}</h2>
                      <p>
                        {practice(current)} · {current.quantity} request units
                      </p>
                    </div>
                    <div className={shell.actions}>
                      {current.stage === "Review" &&
                        current.accepted_quote_id &&
                        button("Mark Ready →", "ready")}
                      {current.stage === "Hold" &&
                        current.accepted_quote_id &&
                        button("Resume coordination", "resume")}
                      {current.stage === "Coordinating" &&
                        button("Record completion", "complete")}
                    </div>
                  </section>
                )}
                {tab === "Quotes" && (
                  <>
                    <div className={styles.sectionHeading}>
                      <h2>Supplier quote requests</h2>
                      {current &&
                        ["Draft", "Review", "Hold"].includes(current.stage) &&
                        !current.accepted_quote_id &&
                        button("Record supplier request +", "rfq")}
                    </div>
                    <div className={styles.rfqs}>
                      {data!.rfqs
                        .filter((f) => f.request_id === current?.id)
                        .map((f) => (
                          <div className={shell.panel} key={f.id}>
                            <strong>{f.reference}</strong>
                            <p>
                              {f.status} · Response requested {when(f.due_on)}
                            </p>
                            <small>{f.notes}</small>
                          </div>
                        ))}
                    </div>
                    <div className={styles.sectionHeading}>
                      <h2>Quoted terms</h2>
                      {current &&
                        data!.rfqs.some((f) => f.request_id === current.id) &&
                        !current.accepted_quote_id &&
                        button("Record quote +", "quote")}
                    </div>
                    <p className={styles.help}>
                      Each quote preserves its currency and complete charges.
                      Totals are not converted between currencies.
                    </p>
                    <div className={shell.cards}>
                      {quotes.map((q) => (
                        <article key={q.id} className={shell.panel}>
                          <div className={shell.row}>
                            <span className={shell.eyebrow}>
                              {q.supplier_reference}
                            </span>
                            <span className={shell.status}>{q.status}</span>
                          </div>
                          <div className={styles.total}>
                            {formatMoney(q.total_minor, q.currency)}
                          </div>
                          <p>
                            {q.quantity} × {q.unit} · {q.lead_days} days quoted
                            lead time
                          </p>
                          <dl className={shell.facts}>
                            <div>
                              <dt>Unit price</dt>
                              <dd>{formatMoney(q.unit_minor, q.currency)}</dd>
                            </div>
                            <div>
                              <dt>Shipping</dt>
                              <dd>
                                {formatMoney(q.shipping_minor, q.currency)}
                              </dd>
                            </div>
                            <div>
                              <dt>Tax</dt>
                              <dd>{formatMoney(q.tax_minor, q.currency)}</dd>
                            </div>
                            <div>
                              <dt>Valid through</dt>
                              <dd>{when(q.valid_until)}</dd>
                            </div>
                          </dl>
                          <p>{q.practice_summary}</p>
                          <p>{q.delivery_terms}</p>
                          <a
                            href={q.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Original quote evidence
                          </a>
                          <div className={shell.actions}>
                            {["Draft", "Shared", "Accepted"].includes(
                              q.status,
                            ) &&
                              button(
                                q.status === "Draft"
                                  ? "Review publication"
                                  : "Withdraw quote",
                                "quote_status",
                                q,
                              )}
                            {q.status === "Shared" &&
                              !current?.portal_offer_id &&
                              !current?.accepted_quote_id &&
                              button(
                                "Accept for internal coordination",
                                "internal_accept",
                                q,
                              )}
                            {q.status === "Shared" &&
                              current?.portal_offer_id && (
                                <small>
                                  Awaiting a decision from the practice
                                  requester.
                                </small>
                              )}
                          </div>
                        </article>
                      ))}
                    </div>
                    {!quotes.length && (
                      <div className={shell.empty}>
                        <h2>Start with a documented supplier quote.</h2>
                        <p>
                          Record the supplier contact reference, then capture
                          and review actual quoted terms.
                        </p>
                      </div>
                    )}
                  </>
                )}
                {tab === "Fulfillment" && (
                  <>
                    <div className={styles.sectionHeading}>
                      <h2>Partner handoffs</h2>
                      {current &&
                        ["Ready", "Coordinating"].includes(current.stage) &&
                        button("Record partner handoff +", "handoff")}
                    </div>
                    <div className={shell.cards}>
                      {shipments.map((s) => (
                        <article key={s.id} className={shell.panel}>
                          <div className={shell.row}>
                            <span className={shell.eyebrow}>
                              {s.quantity} REQUEST UNITS
                            </span>
                            <span className={shell.status}>{s.status}</span>
                          </div>
                          <h2>{s.carrier || "Partner handoff"}</h2>
                          <p>
                            Tracking: {s.tracking_reference || "Not supplied"}
                          </p>
                          <p>Expected {when(s.expected_on)}</p>
                          <small>
                            Internal reference: {s.partner_reference}
                          </small>
                          <h3>Shipment lots</h3>
                          {data!.lots
                            .filter((l) => l.shipment_id === s.id)
                            .map((l) => (
                              <p key={l.id}>
                                <strong>{l.lot_code}</strong> · {l.quantity}{" "}
                                units · Expires {when(l.expires_on)}
                              </p>
                            ))}
                          <div className={shell.actions}>
                            {["Preparing", "Exception"].includes(s.status) &&
                              button("Record lot +", "lot", s)}
                            {s.status !== "Cancelled" &&
                              button("Record progress", "shipment", s)}
                          </div>
                          {data!.shipment_events
                            .filter((e) => e.shipment_id === s.id)
                            .map((e) => (
                              <p key={e.id}>
                                {when(e.occurred_on)} · {e.practice_message}
                              </p>
                            ))}
                        </article>
                      ))}
                    </div>
                    {!shipments.length && (
                      <div className={shell.empty}>
                        <h2>Every handoff keeps its context.</h2>
                        <p>
                          Accept reviewed terms and mark the request Ready
                          before recording a partner handoff.
                        </p>
                      </div>
                    )}
                  </>
                )}
                {tab === "Follow-ups" && (
                  <>
                    <div className={styles.sectionHeading}>
                      <h2>Delivery & lot follow-ups</h2>
                      {button("Open recall follow-up +", "recall")}
                    </div>
                    <div className={shell.cards}>
                      {data!.issues.map((i) => (
                        <article key={i.id} className={shell.panel}>
                          <div className={shell.row}>
                            <span className={shell.eyebrow}>{i.kind}</span>
                            <span className={shell.status}>{i.status}</span>
                          </div>
                          <h2>
                            {requestLabel(
                              data!.requests.find((r) => r.id === i.request_id),
                            )}
                          </h2>
                          <p>{i.practice_message}</p>
                          <p>{i.internal_details}</p>
                          {i.resolution && <p>{i.resolution}</p>}
                          {i.status === "Open" &&
                            button(
                              "Resolve follow-up",
                              "resolve_issue",
                              i,
                              data!.requests.find((r) => r.id === i.request_id),
                            )}
                        </article>
                      ))}
                    </div>
                    <h2 className={styles.caseHeading}>Recall cases</h2>
                    {data!.recalls.map((c) => (
                      <article key={c.id} className={shell.panel}>
                        <div className={shell.row}>
                          <h2>
                            {c.reference} / {c.lot_code}
                          </h2>
                          <span className={shell.status}>{c.status}</span>
                        </div>
                        <p>{c.reason}</p>
                        <p>{c.practice_message}</p>
                        <a
                          href={c.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Source evidence
                        </a>
                        {c.status === "Open" && (
                          <div className={shell.actions}>
                            {button(
                              "Close recall follow-up",
                              "close_recall",
                              c,
                            )}
                          </div>
                        )}
                      </article>
                    ))}
                    {!data!.issues.length && !data!.recalls.length && (
                      <div className={shell.empty}>
                        <h2>No follow-ups recorded.</h2>
                        <p>
                          Delivery exceptions and supplier/lot matches appear
                          here with an owner-attributed resolution.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            )
          )}
          <footer className={shell.footer}>
            <span>SIONA / SUPPLY COORDINATION</span>
            <span>THE PATH IS THE WAY.</span>
          </footer>
        </div>
      </div>
      <dialog
        ref={dialog}
        className={shell.dialog}
        aria-labelledby="commerce-form-title"
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else setEditor(null);
        }}
        onClose={() => setEditor(null)}
      >
        {editor && state && (
          <form onSubmit={save}>
            <div className={shell.row}>
              <span className={shell.eyebrow}>
                SIONA / {preview ? "PREVIEW" : "SUPPLY DESK"}
              </span>
              <button
                type="button"
                disabled={busy}
                aria-label="Close form"
                onClick={() => setEditor(null)}
              >
                ×
              </button>
            </div>
            <h2 id="commerce-form-title">{titles[editor.action]}</h2>
            {typeof editor.record?.total_minor === "number" &&
              typeof editor.record?.currency === "string" && (
                <div className={shell.ready}>
                  <strong className={styles.total}>
                    {formatMoney(
                      editor.record.total_minor,
                      editor.record.currency as Currency,
                    )}
                  </strong>
                  <p>
                    {String(editor.record.quantity)} ×{" "}
                    {String(editor.record.unit)} ·{" "}
                    {String(editor.record.lead_days)} days quoted lead time
                  </p>
                  <p>{String(editor.record.delivery_terms)}</p>
                </div>
              )}
            <p>
              {editor.action === "quote"
                ? "Record the source terms exactly. Enter shipping and tax explicitly, including 0 when there is no charge."
                : editor.action === "rfq"
                  ? "Record an actual supplier contact or request reference. This saves a coordination record; it does not send an email."
                  : editor.action === "recall"
                    ? "Record the supplier and exact lot from source evidence. Matching requests receive a follow-up; case closure does not release recalled stock."
                    : "Record the reviewed business outcome. Practice-visible fields are shared with the requesting practice."}
            </p>
            {formError && (
              <p className={shell.attention} role="alert">
                {formError}
              </p>
            )}
            <fieldset disabled={busy}>
              {fieldsFor(editor, state.data, state.core).map((f) => (
                <label
                  key={f.key}
                  className={
                    f.type === "checkbox" ? styles.checkbox : undefined
                  }
                >
                  {f.type === "checkbox" ? (
                    <>
                      <input
                        name={f.key}
                        type="checkbox"
                        required={f.required}
                      />
                      {f.label}
                    </>
                  ) : (
                    <>
                      {f.label}
                      {!f.required && (
                        <span className={shell.optional}>Optional</span>
                      )}
                      {f.type === "select" ? (
                        <select
                          name={f.key}
                          required={f.required}
                          defaultValue={f.value || undefined}
                        >
                          <option value="">Select…</option>
                          {f.options?.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      ) : f.type === "textarea" ? (
                        <textarea
                          name={f.key}
                          required={f.required}
                          defaultValue={f.value || ""}
                          maxLength={2000}
                          rows={3}
                        />
                      ) : (
                        <input
                          name={f.key}
                          type={f.type === "money" ? "text" : f.type || "text"}
                          inputMode={f.type === "money" ? "decimal" : undefined}
                          required={f.required}
                          defaultValue={f.value || ""}
                          min={f.type === "number" ? 0 : undefined}
                          step={f.type === "number" ? 1 : undefined}
                          maxLength={f.type === "url" ? 2000 : 254}
                        />
                      )}
                    </>
                  )}
                </label>
              ))}
            </fieldset>
            <div className={shell.actions}>
              <button className={shell.primary} disabled={busy}>
                {busy ? "Saving…" : preview ? "Save in preview" : "Save record"}
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
    </main>
  );
}
