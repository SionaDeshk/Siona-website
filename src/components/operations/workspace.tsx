"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandSymbol } from "@/components/brand-symbol";
import { Arrow } from "@/components/arrow";
import { PracticeAccess } from "./practice-access";
import {
  emptyData,
  operationSchema,
  readiness,
  today,
  transitions,
  type CoordinationRequest,
  type OperationsData,
} from "@/lib/operations/model";
import { rehearse } from "@/lib/operations/demo";
import { fieldsFor, formTitles, operationFromForm, type Editor } from "./forms";
import styles from "./workspace.module.css";

const tabs = [
  "Command center",
  "Practices",
  "Catalog",
  "Requests",
  "Activity",
  "Practice access",
] as const;
type Tab = (typeof tabs)[number];
const descriptions: Record<Tab, string> = {
  "Command center":
    "The next step, the missing evidence, and every partner handoff.",
  Practices: "A clear onboarding record for each practice and location.",
  Catalog:
    "Product scope, supplier provenance, and eligibility by state and channel.",
  Requests:
    "Coordinate business requests from review to a documented partner handoff.",
  Activity:
    "An attributed history of reviews, changes, and coordination milestones.",
  "Practice access":
    "Publish a focused catalog and grant access to the people coordinating each location.",
};
const dateLabel = (s: string | null) =>
  s
    ? new Date(`${s.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : "Not recorded";
const shortId = (s: string) => s.slice(-8).toUpperCase();
function Status({ children }: { children: string }) {
  const good = ["Ready", "Approved", "Completed"].includes(children);
  return (
    <span className={`${styles.status} ${good ? styles.good : ""}`}>
      <span aria-hidden="true">●</span> <span>{children}</span>
    </span>
  );
}
async function fetchData(signal?: AbortSignal): Promise<OperationsData> {
  const response = await fetch("/api/operations", {
    cache: "no-store",
    signal,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "Could not load Operations.");
  return body;
}

export function OperationsWorkspace({
  role,
  displayName,
  signOut,
  previewData,
}: {
  role: string;
  displayName: string;
  signOut?: () => Promise<void>;
  previewData?: OperationsData;
}) {
  const [data, setData] = useState<OperationsData>(previewData || emptyData);
  const [tab, setTab] = useState<Tab>("Command center");
  const [loading, setLoading] = useState(!previewData),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [editor, setEditor] = useState<Editor | null>(null),
    [formError, setFormError] = useState(""),
    [busy, setBusy] = useState(false);
  const [query, setQuery] = useState(""),
    [channel, setChannel] = useState("All"),
    [selected, setSelected] = useState<string | null>(
      previewData?.requests[0]?.id || null,
    );
  const dialog = useRef<HTMLDialogElement>(null);
  const preview = !!previewData,
    writer = role !== "viewer",
    admin = role === "admin";
  useEffect(() => {
    if (previewData) return;
    const controller = new AbortController();
    fetchData(controller.signal)
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [previewData]);
  useEffect(() => {
    if (editor) dialog.current?.showModal();
    else dialog.current?.close();
  }, [editor]);
  const open = (action: Editor["action"], record?: object) => {
    setFormError("");
    setEditor({
      action,
      record: record as Record<string, unknown> | undefined,
    });
  };
  const navigate = (name: Tab) => {
    setTab(name);
    setQuery("");
  };
  async function reload() {
    try {
      setData(await fetchData());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed.");
    }
  }
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || !writer || busy) return;
    const parsed = operationSchema.safeParse(
      operationFromForm(
        editor,
        new FormData(event.currentTarget),
        fieldsFor(editor, data),
        data,
      ),
    );
    if (!parsed.success) {
      setFormError(
        parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      );
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      if (preview) setData(rehearse(data, parsed.data));
      else {
        const response = await fetch("/api/operations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error || "Could not save this record.");
      }
      setEditor(null);
      setNotice(
        preview
          ? "Preview updated. Changes stay in this tab."
          : "Saved to Operations.",
      );
      if (!preview) await reload();
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : "Could not save this record.",
      );
    } finally {
      setBusy(false);
    }
  }
  const matches = (record: object) =>
    JSON.stringify(record).toLowerCase().includes(query.toLowerCase());
  const supplierName = (supplierId: string) =>
    data.organizations.find(
      (o) =>
        o.id ===
        data.suppliers.find((s) => s.id === supplierId)?.organization_id,
    )?.legal_name || "Supplier record";
  const productName = (request: CoordinationRequest) =>
    data.products.find((p) => p.id === request.product_id)?.name ||
    "Product unavailable";
  const practiceName = (request: CoordinationRequest) =>
    data.practices.find((p) => p.id === request.practice_id)?.legal_name ||
    "Consumer channel planning";
  const active = data.requests.filter(
    (r) => !["Completed", "Cancelled"].includes(r.stage),
  );
  const blocked = active.filter((r) => readiness(r, data).length > 0);
  const requestList = data.requests.filter(
    (r) =>
      (channel === "All" || r.channel === channel) &&
      matches({ ...r, product: productName(r), practice: practiceName(r) }),
  );
  const current = requestList.find((r) => r.id === selected) || requestList[0];
  const actionButton = (
    label: string,
    action: Editor["action"],
    record?: object,
    review = false,
  ) => (
    <button
      disabled={
        !writer ||
        (review && !admin) ||
        loading ||
        !!error ||
        (action === "request" && !data.products.length) ||
        (action === "product" && !record && !data.suppliers.length)
      }
      title={
        action === "request" && !data.products.length
          ? "Add a catalog product before creating a request."
          : action === "product" && !record && !data.suppliers.length
            ? "Add a supplier in Evo before creating a product."
            : review && !admin
              ? "Administrator review required."
              : undefined
      }
      onClick={() => open(action, record)}
    >
      {label}
    </button>
  );
  const empty = (title: string, copy: string) => (
    <div className={styles.empty}>
      <Arrow className={styles.emptyArrow} />
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
  function requestDetail(request: CoordinationRequest) {
    const reasons = readiness(request, data);
    const product = data.products.find((p) => p.id === request.product_id);
    return (
      <section className={styles.panel} aria-label="Request details">
        <div className={styles.row}>
          <span className={styles.eyebrow}>
            REQUEST / {shortId(request.id)}
          </span>
          <Status>{request.stage}</Status>
        </div>
        <h2>{productName(request)}</h2>
        <p>{practiceName(request)}</p>
        <dl className={styles.facts}>
          <div>
            <dt>Channel / state</dt>
            <dd>
              {request.channel} / {request.state}
            </dd>
          </div>
          <div>
            <dt>Quantity</dt>
            <dd>
              {request.quantity} × {product?.unit}
            </dd>
          </div>
          <div>
            <dt>Requested date</dt>
            <dd>{dateLabel(request.needed_on)}</dd>
          </div>
          <div>
            <dt>Handoff reference</dt>
            <dd>{request.handoff_reference || "Awaiting partner handoff"}</dd>
          </div>
          <div>
            <dt>Lot / expiry</dt>
            <dd>
              {request.lot_reference || "Not recorded"}
              {request.lot_expires_on
                ? ` / ${dateLabel(request.lot_expires_on)}`
                : ""}
            </dd>
          </div>
        </dl>
        <p>{request.notes}</p>
        <Link href={`/workspace/commerce?request=${request.id}`}>
          Quotes and fulfillment →
        </Link>
        {request.portal_offer_id && (
          <div className={styles.ready}>
            <strong>Submitted through the practice portal</strong>
            <p>
              Practice reference: {request.portal_reference || "Not supplied"}
            </p>
            <p>
              {request.portal_message || "No additional business requirements."}
            </p>
            {data.practice_updates
              .filter((u) => u.request_id === request.id)
              .map((u) => (
                <p key={u.id}>{u.body}</p>
              ))}
            {actionButton(
              "Publish practice update",
              "practice_update",
              request,
            )}
          </div>
        )}
        {transitions[request.stage].length > 0 && (
          <div className={reasons.length ? styles.attention : styles.ready}>
            <strong>
              {reasons.length
                ? "Before this can progress"
                : "Current reviews are in place"}
            </strong>
            {reasons.length > 0 ? (
              <ul>
                {reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            ) : (
              <p>Reviews are checked again when you record the next stage.</p>
            )}
          </div>
        )}
        {transitions[request.stage].length > 0 &&
          actionButton("Update coordination →", "transition", request)}
        <div className={styles.timeline}>
          <h3>Request history</h3>
          {data.events
            .filter((e) => e.entity_id === request.id)
            .map((e) => (
              <div key={e.id}>
                <small>{dateLabel(e.created_at)}</small>
                <p>{e.notes}</p>
              </div>
            ))}
        </div>
      </section>
    );
  }
  return (
    <main id="main" className={styles.root}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.brand}>
          <BrandSymbol />
          <span>
            SIONA<small>OPERATIONS</small>
          </span>
        </Link>
        <div className={styles.workspaceLabel}>PRIVATE WORKSPACE</div>
        <nav aria-label="Operations workspace">
          {tabs.map((name, i) => (
            <button
              key={name}
              aria-current={tab === name ? "page" : undefined}
              onClick={() => navigate(name)}
            >
              <span>0{i + 1}</span>
              {name}
            </button>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <Link href="/workspace/commerce">Quotes and fulfillment →</Link>
          <Link href="/workspace/intelligence">
            Evolution Engine <Arrow className={styles.external} />
          </Link>
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
      <div className={styles.main}>
        <header className={styles.topbar}>
          <span>SIONA / PRACTICE & SUPPLY COORDINATION</span>
          <div>
            <span className={styles.liveDot} />
            {preview ? "LOCAL REHEARSAL" : "INTERNAL OPERATIONS"}
            {signOut && (
              <form action={signOut}>
                <button aria-label="Sign out of Operations">Sign out</button>
              </form>
            )}
          </div>
        </header>
        {preview && (
          <div className={styles.preview}>
            <strong>Interactive preview · fictional records</strong>
            <span>
              Try the workflow. Changes stay in this tab and reset on refresh.
              No live business data is accessed.
            </span>
          </div>
        )}
        <div className={styles.content}>
          <div className={styles.heading}>
            <div>
              <span className={styles.eyebrow}>
                OPERATIONS / {tab.toUpperCase()}
              </span>
              <h1>
                {tab === "Command center" ? (
                  <>
                    From partner
                    <br />
                    to <em>practice.</em>
                  </>
                ) : (
                  tab
                )}
              </h1>
              <p>{descriptions[tab]}</p>
            </div>
            <div className={styles.headingAction}>
              {tab === "Practices"
                ? actionButton("Add practice +", "practice")
                : tab === "Catalog"
                  ? actionButton("Add product +", "product")
                  : actionButton("New request +", "request")}
            </div>
          </div>
          <p role="status" className={styles.feedback}>
            {notice}
          </p>
          {error && (
            <div role="alert" className={styles.attention}>
              <strong>Operations could not load</strong>
              <p>{error}</p>
              <button onClick={() => void reload()}>Try again</button>
              <Link href="/workspace/intelligence">Open Evo →</Link>
            </div>
          )}
          {data.truncated && (
            <p className={styles.attention}>
              Showing up to 500 records per category. Some linked records may be
              outside this view; the server checks all records before a request
              progresses.
            </p>
          )}
          {loading ? (
            <p role="status">Loading Operations…</p>
          ) : (
            !error && (
              <>
                {tab === "Command center" && (
                  <>
                    <div className={styles.metrics}>
                      {[
                        [
                          "Practices",
                          data.practices.length,
                          "Across your operating locations",
                        ],
                        [
                          "Open requests",
                          active.length,
                          "Review through partner handoff",
                        ],
                        [
                          "Needs attention",
                          blocked.length,
                          "Missing or expired review evidence",
                        ],
                        [
                          "Completed",
                          data.requests.filter((r) => r.stage === "Completed")
                            .length,
                          "Documented coordination records",
                        ],
                      ].map(([name, value, copy]) => (
                        <article key={name}>
                          <span>{name}</span>
                          <strong>{value}</strong>
                          <small>{copy}</small>
                        </article>
                      ))}
                    </div>
                    <section
                      className={styles.flow}
                      aria-label="Coordination workflow"
                    >
                      {[
                        ["01", "Onboard", "Practice & location"],
                        ["02", "Review", "Supplier, product & channel"],
                        ["03", "Coordinate", "External partner handoff"],
                        ["04", "Trace", "Lot, expiry & outcome"],
                      ].map(([n, title, copy]) => (
                        <div key={n}>
                          <span>{n}</span>
                          <h2>{title}</h2>
                          <p>{copy}</p>
                        </div>
                      ))}
                    </section>
                    <div className={styles.columns}>
                      <section className={styles.panel}>
                        <div className={styles.row}>
                          <h2>Needs attention</h2>
                          <button onClick={() => navigate("Requests")}>
                            All requests <Arrow className={styles.external} />
                          </button>
                        </div>
                        {blocked.length ? (
                          blocked.slice(0, 4).map((r) => (
                            <button
                              className={styles.record}
                              key={r.id}
                              onClick={() => {
                                setSelected(r.id);
                                navigate("Requests");
                              }}
                            >
                              <div>
                                <strong>{productName(r)}</strong>
                                <span>
                                  {practiceName(r)} · {r.state}
                                </span>
                                <small>{readiness(r, data)[0]}</small>
                              </div>
                              <Arrow className={styles.external} />
                            </button>
                          ))
                        ) : (
                          <p>
                            No blocked requests in the current view. Start by
                            adding a practice and a product.
                          </p>
                        )}
                      </section>
                      <section className={`${styles.panel} ${styles.guide}`}>
                        <span className={styles.eyebrow}>
                          YOUR FIRST WORKFLOW
                        </span>
                        <h2>A place for the operational details.</h2>
                        <p>
                          Add a practice. Bring a supplier across from Evo.
                          Document the product’s permitted scope, then create a
                          coordination request.
                        </p>
                        <div className={styles.actions}>
                          {actionButton("Add a practice →", "practice")}
                          <button onClick={() => navigate("Catalog")}>
                            Explore catalog
                          </button>
                        </div>
                        <small>
                          Clinical decisions and patient-specific orders stay in
                          your licensed partners’ systems.
                        </small>
                      </section>
                    </div>
                    <section className={styles.channelStrip}>
                      <div>
                        <span className={styles.eyebrow}>
                          TWO CHANNELS. SEPARATE REVIEWS.
                        </span>
                        <h2>Built around the route to market.</h2>
                      </div>
                      <p>
                        Clinician requests connect to a reviewed practice.
                        Consumer planning has its own state and product
                        eligibility. Each route keeps its own evidence.
                      </p>
                    </section>
                  </>
                )}
                {(["Practices", "Catalog", "Requests"] as Tab[]).includes(
                  tab,
                ) && (
                  <div className={styles.toolbar}>
                    <label>
                      Search {tab.toLowerCase()}
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        type="search"
                        placeholder="Find a record…"
                      />
                    </label>
                    {tab === "Requests" && (
                      <label>
                        Channel
                        <select
                          value={channel}
                          onChange={(e) => setChannel(e.target.value)}
                        >
                          {["All", "Clinician", "Consumer"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                )}
                {tab === "Practices" &&
                  (data.practices.length ? (
                    <div className={styles.cards}>
                      {data.practices.filter(matches).map((p) => (
                        <article key={p.id} className={styles.panel}>
                          <div className={styles.row}>
                            <span className={styles.eyebrow}>
                              {p.state} / PRACTICE
                            </span>
                            <Status>
                              {p.status === "Ready" &&
                              p.valid_until &&
                              p.valid_until < today()
                                ? "Review expired"
                                : p.status}
                            </Status>
                          </div>
                          <h2>{p.legal_name}</h2>
                          <p>{p.scope}</p>
                          <dl className={styles.facts}>
                            <div>
                              <dt>Operations email</dt>
                              <dd>{p.business_email}</dd>
                            </div>
                            <div>
                              <dt>Review valid through</dt>
                              <dd>{dateLabel(p.valid_until)}</dd>
                            </div>
                          </dl>
                          {p.evidence_url && (
                            <a
                              href={p.evidence_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Review evidence{" "}
                              <Arrow className={styles.external} />
                            </a>
                          )}
                          {p.review_notes && <p>{p.review_notes}</p>}
                          <div className={styles.actions}>
                            {actionButton("Edit practice", "practice", p)}
                            {actionButton(
                              "Review onboarding",
                              "practice_review",
                              p,
                              true,
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    empty(
                      "Your first practice starts here.",
                      "Create one record per location so onboarding and state eligibility stay explicit.",
                    )
                  ))}
                {tab === "Catalog" && (
                  <>
                    {!data.suppliers.length && (
                      <div className={styles.attention}>
                        Add supplier records in{" "}
                        <Link href="/workspace/intelligence">
                          Evo’s Supply network{" "}
                          <Arrow className={styles.external} />
                        </Link>{" "}
                        before creating products.
                      </div>
                    )}
                    {data.products.length ? (
                      <div className={styles.cards}>
                        {data.products.filter(matches).map((p) => (
                          <article key={p.id} className={styles.panel}>
                            <div className={styles.row}>
                              <span className={styles.eyebrow}>{p.sku}</span>
                              <Status>{p.kind}</Status>
                            </div>
                            <h2>{p.name}</h2>
                            <p>{p.description}</p>
                            <dl className={styles.facts}>
                              <div>
                                <dt>Supplier</dt>
                                <dd>{supplierName(p.supplier_id)}</dd>
                              </div>
                              <div>
                                <dt>Unit</dt>
                                <dd>{p.unit}</dd>
                              </div>
                            </dl>
                            <h3>State & channel reviews</h3>
                            {data.eligibility
                              .filter((e) => e.product_id === p.id)
                              .map((e) => (
                                <div className={styles.eligibility} key={e.id}>
                                  <div>
                                    <strong>
                                      {e.state} / {e.channel}
                                    </strong>
                                    <Status>
                                      {e.valid_until < today() ||
                                      e.product_revision !== p.revision
                                        ? "Review required"
                                        : e.status}
                                    </Status>
                                  </div>
                                  <small>
                                    Valid through {dateLabel(e.valid_until)}
                                  </small>
                                  <a
                                    href={e.evidence_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    Evidence{" "}
                                    <Arrow className={styles.external} />
                                  </a>
                                </div>
                              ))}
                            {!data.eligibility.some(
                              (e) => e.product_id === p.id,
                            ) && <p>No state or channel has been reviewed.</p>}
                            {data.practice_offers
                              .filter((o) => o.product_id === p.id)
                              .map((o) => (
                                <div key={o.id} className={styles.eligibility}>
                                  <strong>
                                    {o.state} / Practice publication
                                  </strong>
                                  <p>
                                    {o.title} ·{" "}
                                    {o.product_revision !== p.revision
                                      ? "Review required"
                                      : o.status}
                                  </p>
                                  <button
                                    disabled={!admin || !data.portal_ready}
                                    onClick={() => open("practice_offer", o)}
                                  >
                                    Edit publication
                                  </button>
                                </div>
                              ))}
                            <div className={styles.actions}>
                              {actionButton("Edit product", "product", p)}
                              {actionButton(
                                "Review eligibility",
                                "eligibility",
                                p,
                                true,
                              )}
                              {data.portal_ready &&
                                actionButton(
                                  "Publish to practice",
                                  "practice_offer",
                                  p,
                                  true,
                                )}
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      empty(
                        "A catalog with evidence behind it.",
                        "Connect a product or service to an Evo supplier, then review each state and channel separately.",
                      )
                    )}
                  </>
                )}
                {tab === "Requests" &&
                  (data.requests.length ? (
                    <div className={styles.requestLayout}>
                      <section
                        className={styles.requestList}
                        aria-label="Coordination requests"
                      >
                        {requestList.map((r) => (
                          <button
                            key={r.id}
                            aria-pressed={current?.id === r.id}
                            onClick={() => setSelected(r.id)}
                          >
                            <div className={styles.row}>
                              <span className={styles.eyebrow}>
                                {r.channel} / {r.state}
                              </span>
                              <Status>{r.stage}</Status>
                            </div>
                            <strong>{productName(r)}</strong>
                            <span>{practiceName(r)}</span>
                            <small>
                              {r.quantity} units · Requested{" "}
                              {dateLabel(r.needed_on)}
                            </small>
                          </button>
                        ))}
                        {!requestList.length && (
                          <p>No requests match these filters.</p>
                        )}
                      </section>
                      {current && requestDetail(current)}
                    </div>
                  ) : (
                    empty(
                      "Every handoff has a next step.",
                      "Create a draft, review eligibility, and record the external partner reference as coordination progresses.",
                    )
                  ))}
                {tab === "Activity" && (
                  <section className={styles.panel}>
                    <h2>Operations history</h2>
                    <div className={styles.timeline}>
                      {data.events.map((e) => (
                        <div key={e.id}>
                          <small>
                            {dateLabel(e.created_at)} ·{" "}
                            {e.action.replaceAll("_", " ")} · Actor{" "}
                            {shortId(e.actor_id)}
                          </small>
                          <p>{e.notes}</p>
                        </div>
                      ))}
                      {!data.events.length && (
                        <p>
                          Reviews and coordination updates will appear here.
                        </p>
                      )}
                    </div>
                  </section>
                )}
              </>
            )
          )}
          {tab === "Practice access" && (
            <PracticeAccess data={data} admin={admin} open={open} />
          )}
          <footer className={styles.footer}>
            <span>
              SIONA OPERATIONS /{" "}
              {preview ? "SYNTHETIC REHEARSAL" : "PRIVATE WORKSPACE"}
            </span>
            <span>THE PATH IS THE WAY.</span>
          </footer>
        </div>
      </div>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="operations-form-title"
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else setEditor(null);
        }}
        onClose={() => setEditor(null)}
      >
        {editor && (
          <form onSubmit={save}>
            <div className={styles.row}>
              <span className={styles.eyebrow}>
                SIONA / {preview ? "PREVIEW" : "OPERATIONS"}
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
            <h2 id="operations-form-title">{formTitles[editor.action]}</h2>
            <p>
              {editor.action === "practice_offer"
                ? "The title and description are visible to practice users. Internal publication notes stay private. Publishing requires current clinician eligibility for the selected state."
                : editor.action === "practice_access"
                  ? "Link an existing Supabase Auth account to a practice location. Linking access does not create the account or send an invitation."
                  : editor.action === "practice_update"
                    ? "This update will be visible to the practice that submitted the request. Use business information only."
                    : editor.action === "eligibility" ||
                        editor.action === "practice_review"
                      ? "Record the evidence and the scope you reviewed. Approval is attributed to your account."
                      : editor.action === "transition"
                        ? "Record the outcome and the next step. Handoffs need an external partner reference; completed supplies need a lot and expiry."
                        : "Use business information only. Keep patient records in the appropriate clinical system."}
            </p>
            {["practice", "product"].includes(editor.action) &&
              editor.record && (
                <p className={styles.attention}>
                  Editing these details requires a new review before further
                  coordination.
                </p>
              )}
            {formError && (
              <p role="alert" className={styles.attention}>
                {formError}
              </p>
            )}
            <fieldset disabled={busy}>
              {fieldsFor(editor, data).map((field) => {
                const value =
                  field.value ?? String(editor.record?.[field.key] ?? "");
                return (
                  <label key={field.key}>
                    {field.label}
                    {!field.required && (
                      <span className={styles.optional}>Optional</span>
                    )}
                    {field.type === "select" ? (
                      <select
                        name={field.key}
                        required={field.required}
                        defaultValue={value || undefined}
                      >
                        <option value="">Select…</option>
                        {field.options?.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        name={field.key}
                        required={field.required}
                        defaultValue={value}
                        maxLength={2000}
                        rows={3}
                      />
                    ) : (
                      <input
                        name={field.key}
                        type={field.type || "text"}
                        required={field.required}
                        defaultValue={value}
                        min={field.type === "number" ? 1 : undefined}
                        max={field.type === "number" ? 100000 : undefined}
                        step={field.type === "number" ? 1 : undefined}
                        maxLength={field.type === "url" ? 2000 : 254}
                      />
                    )}
                  </label>
                );
              })}
            </fieldset>
            <div className={styles.actions}>
              <button className={styles.primary} type="submit" disabled={busy}>
                {busy ? "Saving…" : preview ? "Save in preview" : "Save record"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditor(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </dialog>
    </main>
  );
}
