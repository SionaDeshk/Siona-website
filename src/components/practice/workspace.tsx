"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandSymbol } from "@/components/brand-symbol";
import { Arrow } from "@/components/arrow";
import {
  canCancel,
  practiceOperationSchema,
  stageLabel,
  type PracticeData,
  type PracticeLocation,
  type PracticeOffer,
  type PracticeRequest,
} from "@/lib/practice/model";
import { rehearsePractice } from "@/lib/practice/demo";
import styles from "./workspace.module.css";

type Editor =
  | {
      kind: "submit";
      practice_id: string;
      offer: PracticeOffer;
      key: string;
      minDate: string;
      maxDate: string;
    }
  | { kind: "cancel"; request: PracticeRequest };
const date = (value: string) =>
  new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
async function load(
  practice: string,
  signal?: AbortSignal,
): Promise<PracticeData> {
  const response = await fetch(
    `/api/practice?practice_id=${encodeURIComponent(practice)}`,
    { cache: "no-store", signal },
  );
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error || "Could not load your practice.");
  return body;
}
export function PracticeWorkspace({
  locations,
  signOut,
  previewFixtures,
}: {
  locations: PracticeLocation[];
  signOut?: () => Promise<void>;
  previewFixtures?: PracticeData[];
}) {
  const [selectedPractice, setSelectedPractice] = useState(
    locations[0]?.id || "",
  );
  const [data, setData] = useState<PracticeData | null>(
    previewFixtures?.[0] || null,
  );
  const [rehearsals, setRehearsals] = useState(previewFixtures);
  const [tab, setTab] = useState("Overview"),
    [loading, setLoading] = useState(!previewFixtures),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null),
    [editor, setEditor] = useState<Editor | null>(null),
    [formError, setFormError] = useState(""),
    [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const preview = !!previewFixtures;
  useEffect(() => {
    if (preview) return;
    const controller = new AbortController();
    load(selectedPractice, controller.signal)
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [selectedPractice, preview]);
  useEffect(() => {
    if (editor) dialog.current?.showModal();
    else dialog.current?.close();
  }, [editor]);
  const practice =
    data?.practices.find((p) => p.id === selectedPractice) ||
    locations.find((p) => p.id === selectedPractice);
  const requester = data?.role === "requester";
  const current =
    data?.requests.find((r) => r.id === selectedRequest) || data?.requests[0];
  function switchPractice(id: string) {
    setSelectedPractice(id);
    setSelectedRequest(null);
    setNotice("");
    setError("");
    setEditor(null);
    if (preview) setData(rehearsals?.find((r) => r.practice_id === id) || null);
    else {
      setData(null);
      setLoading(true);
    }
  }
  function openOffer(offer: PracticeOffer) {
    const start = new Date();
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 365);
    setFormError("");
    setEditor({
      kind: "submit",
      practice_id: selectedPractice,
      offer,
      key: crypto.randomUUID(),
      minDate: start.toISOString().slice(0, 10),
      maxDate: end.toISOString().slice(0, 10),
    });
  }
  async function refresh() {
    try {
      setData(await load(selectedPractice));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed.");
    }
  }
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || !data || !requester || busy) return;
    const form = new FormData(event.currentTarget);
    const parsed = practiceOperationSchema.safeParse(
      editor.kind === "submit"
        ? {
            action: "submit",
            practice_id: editor.practice_id,
            offer_id: editor.offer.id,
            submission_key: editor.key,
            quantity: Number(form.get("quantity")),
            needed_on: String(form.get("needed_on")),
            reference: String(form.get("reference") || ""),
            message: String(form.get("message") || ""),
          }
        : {
            action: "cancel",
            request_id: editor.request.id,
            version: editor.request.version,
            reason: String(form.get("reason") || ""),
          },
    );
    if (!parsed.success) {
      setFormError(parsed.error.issues.map((i) => i.message).join(" "));
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      let id: string;
      if (preview) {
        const result = rehearsePractice(data, parsed.data);
        setData(result.data);
        setRehearsals((all) =>
          all?.map((r) =>
            r.practice_id === result.data.practice_id ? result.data : r,
          ),
        );
        id = result.id;
      } else {
        const response = await fetch("/api/practice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error || "Could not save this request.");
        id = body.id;
      }
      setSelectedRequest(id);
      setTab("Requests");
      setEditor(null);
      setNotice(
        preview
          ? "Preview updated. Changes stay in this tab."
          : parsed.data.action === "submit"
            ? "Submitted for coordination review."
            : "Coordination request cancelled.",
      );
      if (!preview) await refresh();
    } catch (e) {
      setFormError(
        e instanceof Error ? e.message : "Could not complete this request.",
      );
    } finally {
      setBusy(false);
    }
  }
  function catalog() {
    return data?.offers.length ? (
      <div className={styles.cards}>
        {data.offers.slice(0, 100).map((offer) => (
          <article className={styles.card} key={offer.id}>
            <div className={styles.row}>
              <span className={styles.eyebrow}>
                {practice?.state} / PRACTICE CATALOG
              </span>
              <span className={styles.tag}>Published</span>
            </div>
            <div className={styles.productMark} aria-hidden="true">
              <svg viewBox="0 0 100 100" fill="none">
                <path
                  d="m50 10 34 20v40L50 90 16 70V30L50 10Z M16 30l34 20 34-20 M50 50v40 M33 20l34 20v40"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>
            </div>
            <h2>{offer.title}</h2>
            <p>{offer.summary}</p>
            <dl className={styles.facts}>
              <div>
                <dt>Request unit</dt>
                <dd>{offer.unit}</dd>
              </div>
              <div>
                <dt>Publication valid through</dt>
                <dd>{date(offer.valid_until)}</dd>
              </div>
            </dl>
            <button
              className={styles.primary}
              disabled={!requester}
              onClick={() => openOffer(offer)}
            >
              Request coordination{" "}
              <Arrow direction="right" className={styles.arrow} />
            </button>
          </article>
        ))}
      </div>
    ) : (
      <div className={styles.empty}>
        <h2>Your catalog will appear here.</h2>
        <p>
          Siona publishes entries after reviewing the product, supplier, and
          your practice’s location.
        </p>
      </div>
    );
  }
  function requestDetail(request: PracticeRequest) {
    return (
      <section className={styles.card} aria-label="Practice request details">
        <div className={styles.row}>
          <span className={styles.eyebrow}>
            REQUEST / {request.id.slice(-8).toUpperCase()}
          </span>
          <span className={styles.tag}>{stageLabel[request.stage]}</span>
        </div>
        <h2>{request.title}</h2>
        <dl className={styles.facts}>
          <div>
            <dt>Quantity</dt>
            <dd>
              {request.quantity} × {request.unit}
            </dd>
          </div>
          <div>
            <dt>Requested date</dt>
            <dd>{date(request.needed_on)}</dd>
          </div>
          <div>
            <dt>Practice reference</dt>
            <dd>{request.reference || "Not supplied"}</dd>
          </div>
        </dl>
        {request.message && <p>{request.message}</p>}
        <h3>Progress & updates</h3>
        <ol className={styles.timeline}>
          {data?.updates
            .filter((u) => u.request_id === request.id)
            .map((u) => (
              <li key={u.id}>
                <small>
                  {date(u.created_at)} ·{" "}
                  {u.kind === "status" ? "Progress" : "Practice update"}
                </small>
                <p>{u.body}</p>
              </li>
            ))}
        </ol>
        {canCancel(request, data?.role || "viewer") && (
          <button
            onClick={() => {
              setFormError("");
              setEditor({ kind: "cancel", request });
            }}
          >
            Cancel request
          </button>
        )}
      </section>
    );
  }
  return (
    <main id="main" className={styles.root}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <BrandSymbol />
          <span>
            SIONA<small>PRACTICE PORTAL</small>
          </span>
        </Link>
        <div className={styles.account}>
          <span className={styles.eyebrow}>
            {preview ? "LOCAL REHEARSAL" : "PRIVATE PRACTICE ACCESS"}
          </span>
          {signOut && (
            <form action={signOut}>
              <button>Sign out</button>
            </form>
          )}
        </div>
      </header>
      {preview && (
        <div className={styles.preview}>
          <strong>Interactive practice preview · fictional records</strong>
          <span>
            Changes stay in this tab. This preview never submits live requests.
          </span>
        </div>
      )}
      <div className={styles.container}>
        <div className={styles.practiceBar}>
          <label>
            Practice location
            <select
              value={selectedPractice}
              disabled={busy || !!editor || loading}
              onChange={(e) => switchPractice(e.target.value)}
            >
              {locations.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.state}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className={styles.tag}>
              {practice?.state} /{" "}
              {data?.role === "viewer" ? "View only" : "Request access"}
            </span>
            <small>Business supply coordination</small>
          </div>
        </div>
        <nav aria-label="Practice portal">
          {["Overview", "Catalog", "Requests"].map((name) => (
            <button
              key={name}
              aria-current={tab === name ? "page" : undefined}
              onClick={() => setTab(name)}
            >
              {name}
              <span>
                {name === "Catalog"
                  ? data?.offers.length || 0
                  : name === "Requests"
                    ? data?.requests.length || 0
                    : "01"}
              </span>
            </button>
          ))}
        </nav>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>SIONA / {tab.toUpperCase()}</span>
          <h1>
            {tab === "Overview" ? (
              <>
                A clearer path
                <br />
                for your <em>practice.</em>
              </>
            ) : tab === "Catalog" ? (
              <>
                Your practice <em>catalog.</em>
              </>
            ) : (
              <>
                Every request.
                <br />
                <em>One view.</em>
              </>
            )}
          </h1>
          <p>
            {tab === "Overview"
              ? "Your catalog, coordination requests, and partner updates in one place."
              : tab === "Catalog"
                ? "Entries published for your practice’s state and reviewed scope."
                : "Follow each coordination request from review to completion."}
          </p>
        </div>
        <p role="status" className={styles.feedback}>
          {notice}
        </p>
        {error && (
          <div className={styles.notice} role="alert">
            <p>{error}</p>
            <button onClick={() => void refresh()}>Try again</button>
          </div>
        )}
        {loading ? (
          <p role="status">Loading your practice…</p>
        ) : (
          !error &&
          data && (
            <>
              {data.truncated && (
                <p className={styles.notice}>
                  Showing the most recent 100 requests and up to 100 catalog
                  entries. Contact Siona Operations for older records.
                </p>
              )}
              {practice?.status !== "Ready" && (
                <p className={styles.notice}>
                  Your practice’s onboarding review is in progress. Existing
                  request history remains available.
                </p>
              )}
              {tab === "Overview" && (
                <>
                  <div className={styles.metrics}>
                    {[
                      [
                        "Open requests",
                        data.requests.filter(
                          (r) => !["Completed", "Cancelled"].includes(r.stage),
                        ).length,
                      ],
                      ["Published entries", Math.min(data.offers.length, 100)],
                      [
                        "Completed",
                        data.requests.filter((r) => r.stage === "Completed")
                          .length,
                      ],
                    ].map(([label, value]) => (
                      <article key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </article>
                    ))}
                  </div>
                  <div className={styles.overviewGrid}>
                    <section className={styles.next}>
                      <span className={styles.eyebrow}>YOUR NEXT STEP</span>
                      <h2>
                        A simpler handoff
                        <br />
                        starts here.
                      </h2>
                      <p>
                        Browse the entries published for your location, choose a
                        request unit, and tell us what you need. Siona
                        Operations reviews the next step.
                      </p>
                      <button
                        className={styles.primary}
                        onClick={() => setTab("Catalog")}
                      >
                        Explore your catalog{" "}
                        <Arrow direction="right" className={styles.arrow} />
                      </button>
                    </section>
                    <section className={styles.card}>
                      <div className={styles.row}>
                        <h2>Recent requests</h2>
                        <button onClick={() => setTab("Requests")}>
                          View all <Arrow className={styles.arrow} />
                        </button>
                      </div>
                      {data.requests.slice(0, 3).map((r) => (
                        <button
                          className={styles.requestRow}
                          key={r.id}
                          onClick={() => {
                            setSelectedRequest(r.id);
                            setTab("Requests");
                          }}
                        >
                          <div>
                            <strong>{r.title}</strong>
                            <small>Requested {date(r.needed_on)}</small>
                          </div>
                          <span className={styles.tag}>
                            {stageLabel[r.stage]}
                          </span>
                        </button>
                      ))}
                      {!data.requests.length && (
                        <p>Your first coordination request will appear here.</p>
                      )}
                    </section>
                  </div>
                  <div className={styles.route}>
                    <div>
                      <span>01</span>
                      <h3>Request</h3>
                      <p>Share business requirements.</p>
                    </div>
                    <div>
                      <span>02</span>
                      <h3>Review</h3>
                      <p>Confirm the next step.</p>
                    </div>
                    <div>
                      <span>03</span>
                      <h3>Coordinate</h3>
                      <p>Follow partner progress.</p>
                    </div>
                  </div>
                </>
              )}
              {tab === "Catalog" && catalog()}
              {tab === "Requests" &&
                (data.requests.length ? (
                  <div className={styles.requestGrid}>
                    <section
                      className={styles.requestList}
                      aria-label="Practice requests"
                    >
                      {data.requests.slice(0, 100).map((r) => (
                        <button
                          key={r.id}
                          aria-pressed={r.id === current?.id}
                          onClick={() => setSelectedRequest(r.id)}
                        >
                          <span className={styles.tag}>
                            {stageLabel[r.stage]}
                          </span>
                          <strong>{r.title}</strong>
                          <small>
                            {r.quantity} × {r.unit} · {date(r.needed_on)}
                          </small>
                        </button>
                      ))}
                    </section>
                    {current && requestDetail(current)}
                  </div>
                ) : (
                  <div className={styles.empty}>
                    <h2>Your requests start here.</h2>
                    <p>
                      Explore the catalog to submit your first coordination
                      request.
                    </p>
                    <button onClick={() => setTab("Catalog")}>
                      Open catalog
                    </button>
                  </div>
                ))}
            </>
          )
        )}
        <footer className={styles.footer}>
          <span>SIONA / PRACTICE COORDINATION</span>
          <span>THE PATH IS THE WAY.</span>
        </footer>
      </div>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="practice-form-title"
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
                SIONA / {preview ? "PREVIEW" : "PRACTICE REQUEST"}
              </span>
              <button
                type="button"
                aria-label="Close form"
                disabled={busy}
                onClick={() => setEditor(null)}
              >
                ×
              </button>
            </div>
            <h2 id="practice-form-title">
              {editor.kind === "submit"
                ? "Request coordination"
                : "Cancel request"}
            </h2>
            <p>
              {editor.kind === "submit"
                ? editor.offer.title
                : editor.request.title}
            </p>
            <p className={styles.small}>
              Use business information only. Keep patient details in your
              clinical system.
            </p>
            {formError && (
              <p role="alert" className={styles.notice}>
                {formError}
              </p>
            )}
            <fieldset disabled={busy}>
              {editor.kind === "submit" ? (
                <>
                  <label>
                    Quantity · {editor.offer.unit}
                    <input
                      name="quantity"
                      type="number"
                      min={1}
                      max={100000}
                      step={1}
                      required
                      defaultValue={1}
                    />
                  </label>
                  <label>
                    Requested date
                    <input
                      name="needed_on"
                      type="date"
                      min={editor.minDate}
                      max={editor.maxDate}
                      required
                    />
                  </label>
                  <label>
                    Practice reference{" "}
                    <span className={styles.optional}>Optional</span>
                    <input name="reference" maxLength={80} autoComplete="off" />
                  </label>
                  <label>
                    Business requirements{" "}
                    <span className={styles.optional}>Optional</span>
                    <textarea name="message" maxLength={1000} rows={3} />
                  </label>
                </>
              ) : (
                <label>
                  Business reason for cancellation
                  <textarea
                    name="reason"
                    required
                    minLength={10}
                    maxLength={1000}
                    rows={3}
                  />
                </label>
              )}
            </fieldset>
            <div className={styles.actions}>
              <button className={styles.primary} disabled={busy}>
                {busy
                  ? "Saving…"
                  : preview
                    ? "Save in preview"
                    : editor.kind === "submit"
                      ? "Submit for review"
                      : "Confirm cancellation"}
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
