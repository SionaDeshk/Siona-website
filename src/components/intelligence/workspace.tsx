"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  criteria,
  industries,
  opportunityStages,
  qualificationGates,
  scoreOpportunity,
  supplierStages,
  textValue as v,
  type Evaluation,
  type Row,
  type WorkspaceData,
} from "@/lib/intelligence/model";
import { Network } from "./network";
import styles from "./workspace.module.css";

type FormKind =
  | "signal"
  | "opportunity"
  | "organization"
  | "contact"
  | "supplier"
  | "task"
  | "decision"
  | "note"
  | "link"
  | "evaluation"
  | "supplier_stage"
  | "evidence"
  | "source"
  | "category"
  | "review_signal"
  | "verify_document"
  | "task_status"
  | "weights";
type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: [string, string][];
  value?: string;
  help?: string;
};
const tabs = [
  "Overview",
  "Signals",
  "Opportunities",
  "Supply network",
  "Relationships",
  "Decisions",
];
const empty: WorkspaceData = {
  signals: [],
  sources: [],
  opportunities: [],
  evidence: [],
  organizations: [],
  contacts: [],
  suppliers: [],
  documents: [],
  supplier_reviews: [],
  categories: [],
  links: [],
  tasks: [],
  notes: [],
  evaluations: [],
  weights: [],
  decisions: [],
  decision_evidence: [],
  activity: [],
  members: [],
};
const title = (row: Row) =>
  v(row, "title") || v(row, "legal_name") || v(row, "name") || "Untitled";
const when = (value: unknown) =>
  value
    ? new Date(String(value)).toLocaleDateString("en-US", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not recorded";
const options = (rows: Row[], label = "title"): [string, string][] =>
  rows.map((row) => [row.id, v(row, label)]);

const ActionContext = createContext<{
  disabled: boolean;
  open: (kind: FormKind, row?: Row) => void;
}>({ disabled: true, open: () => {} });
async function loadWorkspace(signal?: AbortSignal): Promise<WorkspaceData> {
  const response = await fetch("/api/intelligence", {
    cache: "no-store",
    signal,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error);
  return {
    ...body,
    members: body.members.map((m: Record<string, string>) => ({
      ...m,
      id: m.user_id,
    })),
  };
}
function Button({
  kind,
  row,
  children,
}: {
  kind: FormKind;
  row?: Row;
  children: React.ReactNode;
}) {
  const { disabled, open } = useContext(ActionContext);
  return (
    <button disabled={disabled} onClick={() => open(kind, row)}>
      {children}
    </button>
  );
}
function Badge({ row }: { row: Row }) {
  return (
    <>
      {!!row.demo_batch_id && (
        <span className={styles.synthetic}>SYNTHETIC</span>
      )}
      <span className={styles.badge}>
        {v(row, "stage") || v(row, "review_status") || v(row, "status")}
      </span>
    </>
  );
}
function TaskList({ tasks, members }: { tasks: Row[]; members: Row[] }) {
  return (
    <div className={styles.rows}>
      {tasks.map((task) => (
        <article key={task.id}>
          <div>
            <strong>{title(task)}</strong>
            <p>{v(task, "success_criteria")}</p>
            <small>
              {when(task.due_on)} ·{" "}
              {v(
                members.find((m) => m.id === task.owner_id),
                "display_name",
              )}
            </small>
          </div>
          <Button kind="task_status" row={task}>
            Record outcome
          </Button>
        </article>
      ))}
      {!tasks.length && (
        <p>
          No open actions. Assign a validation task to test a specific
          assumption.
        </p>
      )}
    </div>
  );
}

export function Workspace({
  userId,
  role,
  displayName,
  signOut,
  previewData,
}: {
  userId: string;
  role: string;
  displayName: string;
  signOut?: () => Promise<void>;
  previewData?: WorkspaceData;
}) {
  const [data, setData] = useState<WorkspaceData>(previewData ?? empty),
    [loading, setLoading] = useState(!previewData),
    [error, setError] = useState("");
  const [tab, setTab] = useState("Overview"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState<string>(
      previewData?.opportunities[0]?.id ?? "",
    ),
    [detail, setDetail] = useState<Row | null>(null);
  const [form, setForm] = useState<{ kind: FormKind; row?: Row } | null>(null),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const preview = !!previewData,
    writer = role !== "viewer" && !preview;
  const dialog = useRef<HTMLDialogElement>(null);
  const refresh = useCallback(async () => {
    if (previewData) return;
    try {
      const response = await fetch("/api/intelligence", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setData({
        ...body,
        members: body.members.map((m: Record<string, string>) => ({
          ...m,
          id: m.user_id,
        })),
      });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load workspace.");
    } finally {
      setLoading(false);
    }
  }, [previewData]);
  useEffect(() => {
    if (previewData) return;
    const controller = new AbortController();
    loadWorkspace(controller.signal)
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error ? e.message : "Could not load workspace.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [previewData]);
  useEffect(() => {
    if (form) {
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [form]);
  const mutate = async (operation: Record<string, unknown>) => {
    if (preview) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(operation),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      await refresh();
      setNotice("Saved to the private workspace.");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const open = (kind: FormKind, row?: Row) => {
    setError("");
    setForm({ kind, row });
  };
  const opp =
    data.opportunities.find((row) => row.id === selected) ??
    data.opportunities[0];
  const related = (name: string, key: string, id: string) =>
    data[name]?.filter((row) => row[key] === id) ?? [];
  const organization = (id: unknown) =>
    data.organizations.find((row) => row.id === id);
  const supplierName = (row: Row) =>
    title(organization(row.organization_id) ?? row);
  const evaluations = (id: string) =>
    related("evaluations", "opportunity_id", id) as unknown as Evaluation[];
  const weights = data.weights as unknown as {
    criterion: string;
    weight: number;
  }[];
  const metric = (id: string) => scoreOpportunity(evaluations(id), weights);
  const filtered = (rows: Row[]) =>
    rows.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(query.toLowerCase()),
    );
  const count = (stage: string) =>
    data.opportunities.filter((row) => row.stage === stage).length;
  const activeTasks = data.tasks
    .filter((row) => !["Completed", "Cancelled"].includes(v(row, "status")))
    .sort((a, b) => v(a, "due_on").localeCompare(v(b, "due_on")));
  const forms = (): Field[] => {
    const f = (
      key: string,
      label: string,
      type = "text",
      required = true,
      opts?: [string, string][],
      help?: string,
    ): Field => ({ key, label, type, required, options: opts, help });
    const orgs = options(data.organizations, "legal_name"),
      owners = options(data.members, "display_name"),
      opps = options(data.opportunities),
      signals = options(data.signals);
    switch (form?.kind) {
      case "signal":
        return [
          f("title", "Signal title"),
          f("summary", "Concise summary", "textarea"),
          f("source_url", "Original source URL", "url"),
          f("publisher", "Publisher"),
          f("published_on", "Publication date", "date"),
          f(
            "industry",
            "Industry",
            "select",
            true,
            industries.map((s) => [s, s]),
          ),
          f("geography", "Geography"),
          f("evidence_type", "Evidence classification", "select", true, [
            ["verified_fact", "Verified fact"],
            ["third_party_claim", "Third-party claim"],
            ["ai_interpretation", "AI interpretation"],
          ]),
          f("reliability", "Source reliability", "select", true, [
            ["primary", "Primary source"],
            ["secondary", "Secondary source"],
            ["unverified", "Unverified"],
          ]),
          f("reliability_notes", "Reliability assessment", "textarea"),
          f("why_matters", "Why it matters", "textarea"),
          f("siona_relevance", "Potential relevance to Siona", "textarea"),
          f("confidence", "Confidence", "select", true, [
            ["low", "Low"],
            ["medium", "Medium"],
            ["high", "High"],
          ]),
          f(
            "source_id",
            "Tracked source (optional)",
            "select",
            false,
            options(data.sources, "name"),
          ),
        ];
      case "opportunity":
        return [
          f("title", "Opportunity hypothesis"),
          f("problem", "What problem exists?", "textarea"),
          f("affected", "Who experiences the problem?", "textarea"),
          f(
            "signal_ids",
            "Supporting signals (select one or more)",
            "multiple",
            true,
            signals,
          ),
          f("proposition", "What could Siona provide?", "textarea"),
          f("customers", "Potential customers", "textarea"),
          f("partners", "Potential partners / suppliers", "textarea", false),
          f("revenue", "Revenue hypothesis", "textarea", false),
          f("barriers", "Regulatory / operational barriers", "textarea", false),
          f("assumptions", "Assumptions to test", "textarea"),
          f(
            "invalidation",
            "What would invalidate this opportunity?",
            "textarea",
          ),
        ];
      case "organization":
        return [
          f("legal_name", "Legal organization name"),
          f(
            "kind",
            "Organization type",
            "select",
            true,
            [
              "Research institution",
              "Manufacturer",
              "Procurement",
              "Healthcare organization",
              "Collaborator",
              "Strategic partner",
            ].map((s) => [s, s]),
          ),
          f("location", "Location"),
          f("website", "Website", "url", false),
          f("notes", "Context / next steps", "textarea", false),
        ];
      case "contact":
        return [
          f("organization_id", "Organization", "select", true, orgs),
          f("name", "Contact name"),
          f("role", "Role", "text", false),
          f("email", "Business email", "email", false),
          f("notes", "Relationship context", "textarea", false),
        ];
      case "supplier":
        return [
          f("organization_id", "Legal organization", "select", true, orgs),
          f(
            "classification",
            "Supplier classification",
            "select",
            true,
            ["Manufacturer", "Distributor", "Intermediary"].map((s) => [s, s]),
          ),
          f("manufacturing_locations", "Manufacturing locations", "textarea"),
          f(
            "category_id",
            "Product category",
            "select",
            false,
            options(data.categories, "name"),
          ),
          f(
            "quality_documentation",
            "Regulatory / quality documentation and scope",
            "textarea",
            false,
          ),
          f("coa_available", "Batch-specific COA available", "checkbox", false),
          f(
            "traceability",
            "Lot / manufacturer traceability",
            "textarea",
            false,
          ),
          f(
            "moq_pricing",
            "MOQ, pricing, currency / assumptions",
            "textarea",
            false,
          ),
          f(
            "lead_shipping",
            "Lead times, shipping terms / Incoterms",
            "textarea",
            false,
          ),
          f(
            "verification",
            "Independent verification",
            "select",
            true,
            ["Unverified", "In progress", "Independently verified"].map((s) => [
              s,
              s,
            ]),
          ),
          f("outstanding", "Outstanding requirements", "textarea", false),
          f("next_action", "Next action"),
          f("owner_id", "Internal owner", "select", true, owners),
        ];
      case "task":
        return [
          f("title", "Validation / follow-up action"),
          f("details", "Experiment design / details", "textarea", false),
          f("opportunity_id", "Opportunity", "select", false, opps),
          f("organization_id", "Organization", "select", false, orgs),
          f(
            "kind",
            "Action type",
            "select",
            true,
            ["Validation", "Follow-up", "Documentation", "Research"].map(
              (s) => [s, s],
            ),
          ),
          f("owner_id", "Action owner", "select", true, owners),
          f("due_on", "Due date", "date"),
          f(
            "success_criteria",
            "What outcome would validate or invalidate the assumption?",
            "textarea",
          ),
        ];
      case "decision":
        return [
          f("opportunity_id", "Opportunity", "select", true, opps),
          f(
            "stage",
            "Next stage",
            "select",
            true,
            opportunityStages.map((s) => [s, s]),
          ),
          f(
            "rationale",
            "Decision rationale (at least 20 characters)",
            "textarea",
          ),
          f("signal_ids", "Evidence referenced", "multiple", false, signals),
          f(
            "assumptions_changed",
            "What changed in the evidence / assumptions?",
            "textarea",
            false,
          ),
        ];
      case "evidence":
        return [
          f("opportunity_id", "Opportunity", "select", true, opps),
          f("signal_id", "Source-backed signal", "select", true, signals),
          f(
            "interpretation",
            "How does this evidence support or challenge the hypothesis?",
            "textarea",
          ),
        ];
      case "note":
        return [
          f("organization_id", "Organization", "select", true, orgs),
          f("opportunity_id", "Opportunity", "select", false, opps),
          f("body", "Meeting / communication notes", "textarea"),
          f("next_action", "Next action", "textarea", false),
          f("follow_up_on", "Follow-up date", "date", false),
          f("owner_id", "Follow-up owner", "select", true, owners),
        ];
      case "link":
        return [
          f("opportunity_id", "Opportunity", "select", true, opps),
          f(
            "supplier_id",
            "Supplier (choose this OR an organization)",
            "select",
            false,
            data.suppliers.map((s) => [s.id, supplierName(s)]),
          ),
          f("organization_id", "Organization", "select", false, orgs),
          f("rationale", "Reason for the relationship", "textarea"),
        ];
      case "supplier_stage":
        return [
          f(
            "stage",
            "Next stage",
            "select",
            true,
            supplierStages.map((s) => [s, s]),
          ),
          f(
            "rationale",
            "Documented human-review rationale (20 characters for qualification / rejection)",
            "textarea",
            false,
          ),
          ...qualificationGates.map((g) =>
            f(g, `Reviewed: ${g}`, "checkbox", false),
          ),
          f(
            "human_reviewed",
            "I performed and documented this human review",
            "checkbox",
            false,
          ),
        ];
      case "verify_document":
        return [
          f(
            "notes",
            "What was independently checked? Record reviewer findings.",
            "textarea",
          ),
        ];
      case "review_signal":
        return [
          f("status", "Review status", "select", true, [
            ["reviewed", "Reviewed"],
            ["dismissed", "Dismissed"],
            ["unreviewed", "Unreviewed"],
          ]),
          f("notes", "Review reasoning / reliability findings", "textarea"),
        ];
      case "task_status":
        return [
          f(
            "status",
            "Task status",
            "select",
            true,
            ["Open", "In progress", "Completed", "Cancelled"].map((s) => [
              s,
              s,
            ]),
          ),
          f(
            "result",
            "Outcome / evidence (required to complete)",
            "textarea",
            false,
          ),
        ];
      case "source":
        return [
          f("name", "Source name"),
          f("url", "Public source / approved API URL", "url"),
          f("publisher", "Publisher"),
          f("adapter", "Ingestion adapter", "select", true, [
            ["manual", "Manual source"],
            ["federal-register", "Federal Register · FDA"],
          ]),
          f(
            "approved",
            "Administrator: approve ingestion for this source",
            "checkbox",
            false,
          ),
        ];
      case "category":
        return [
          f("name", "Product category"),
          f("intended_use", "Intended use / classification notes", "textarea"),
        ];
      default:
        return [];
    }
  };
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    const fd = new FormData(event.currentTarget),
      values: Record<string, unknown> = {};
    for (const field of forms()) {
      let value: unknown =
        field.type === "multiple"
          ? fd.getAll(field.key)
          : field.type === "checkbox"
            ? fd.get(field.key) === "on"
            : String(fd.get(field.key) ?? "");
      if (
        [
          "source_id",
          "opportunity_id",
          "organization_id",
          "supplier_id",
          "category_id",
          "follow_up_on",
        ].includes(field.key) &&
        !value
      )
        value = null;
      values[field.key] = value;
    }
    let payload: Record<string, unknown> = {
      operation: form.kind,
      data: values,
    };
    if (form.kind === "supplier" && form.row)
      payload = { operation: "update_supplier", id: form.row.id, data: values };
    if (["link", "note"].includes(form.kind))
      payload = { operation: form.kind, ...values };
    if (
      [
        "supplier_stage",
        "review_signal",
        "task_status",
        "verify_document",
      ].includes(form.kind)
    )
      payload = { operation: form.kind, id: form.row?.id, ...values };
    if (form.kind === "supplier_stage") {
      payload.gates = qualificationGates.filter((g) => values[g]);
      qualificationGates.forEach((g) => delete payload[g]);
    }
    if (form.kind === "evaluation")
      payload = {
        operation: "evaluation",
        data: {
          opportunity_id: form.row?.id,
          scores: criteria.map(([criterion]) => ({
            criterion,
            score: fd.get(criterion) === "" ? null : Number(fd.get(criterion)),
            rationale: String(fd.get(`${criterion}_reason`) || ""),
          })),
        },
      };
    if (form.kind === "weights")
      payload = {
        operation: "weights",
        weights: criteria.map(([criterion]) => ({
          criterion,
          weight: Number(fd.get(criterion)),
        })),
      };
    if (await mutate(payload)) setForm(null);
  }
  async function analyze(opportunity: Row) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "analyze",
          opportunity_id: opportunity.id,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      if (body.data.status === "not_configured") setNotice(body.data.message);
      else
        setDetail({
          id: "ai-draft",
          title: "AI-GENERATED DRAFT · HUMAN REVIEW REQUIRED",
          ...body.data,
        });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "AI analysis failed. No records changed.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function upload(
    event: React.ChangeEvent<HTMLInputElement>,
    supplier: Row,
  ) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    fd.set("supplier_id", supplier.id);
    setBusy(true);
    try {
      const response = await fetch("/api/intelligence/documents", {
        method: "POST",
        body: fd,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      await refresh();
      setNotice("Document uploaded privately. Verification is still required.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <ActionContext.Provider value={{ disabled: !writer || busy, open }}>
      <main id="main" className={styles.root}>
        <aside className={styles.sidebar}>
          <Link href="/" className={styles.wordmark}>
            SIONA<span>EVOLUTION ENGINE</span>
          </Link>
          <div className={styles.systemLabel}>INTELLIGENCE / BIOLOGICS</div>
          <nav aria-label="Intelligence workspace">
            {tabs.map((name, i) => (
              <button
                key={name}
                aria-current={tab === name ? "page" : undefined}
                onClick={() => {
                  setTab(name);
                  setQuery("");
                }}
              >
                <span>0{i + 1}</span>
                {name}
              </button>
            ))}
          </nav>
          <div className={styles.sidebarBottom}>
            <span className={styles.dot} /> PRIVATE WORKSPACE
            <p>
              {displayName}
              <br />
              <span>{role}</span>
            </p>
            {signOut && (
              <form action={signOut}>
                <button>Sign out →</button>
              </form>
            )}
            <Link href="/">Siona Group →</Link>
          </div>
        </aside>
        <div className={styles.main}>
          {signOut && (
            <form action={signOut} className={styles.mobileSession}>
              <span>
                {displayName} · {role}
              </span>
              <button>Sign out</button>
            </form>
          )}
          <header className={styles.topbar}>
            <span>
              IDENTIFY <i>→</i> EVALUATE <i>→</i> VALIDATE <i>→</i> DEVELOP
            </span>
            <span>HUMAN DECISIONS. TRACEABLE EVIDENCE.</span>
          </header>
          {preview && (
            <div className={styles.notice}>
              <strong>Synthetic design preview · no live business data</strong>
              <p>
                Interactions explore fictional records. Writing is disabled
                here. Configure Supabase and sign in to use the real workflow.
                This preview route is unavailable in production.
              </p>
            </div>
          )}
          <div className={styles.heading}>
            <div>
              <p className={styles.eyebrow}>
                SIONA INTELLIGENCE / {tab.toUpperCase()}
              </p>
              <h1>{tab === "Overview" ? "From signal to conviction." : tab}</h1>
              <p>
                {tab === "Overview"
                  ? "What needs attention. What remains unknown. What happens next."
                  : "Evidence first. Keep the reasoning visible."}
              </p>
            </div>
            <span className={styles.secure}>● INTERNAL</span>
          </div>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
              <button onClick={() => setError("")}>Dismiss</button>
            </p>
          )}
          <p role="status" aria-live="polite" className={styles.feedback}>
            {notice}
          </p>
          {loading ? (
            <p>Loading private workspace…</p>
          ) : (
            <>
              {tab !== "Overview" && (
                <div className={styles.toolbar}>
                  <label>
                    Filter records
                    <input
                      type="search"
                      placeholder="Search this view…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <div>
                    {tab === "Signals" && (
                      <>
                        <Button kind="source">Add source</Button>
                        <Button kind="signal">New signal +</Button>
                      </>
                    )}
                    {tab === "Opportunities" && (
                      <>
                        <Button kind="link" row={opp}>
                          Link relationship
                        </Button>
                        <Button kind="opportunity">New hypothesis +</Button>
                      </>
                    )}
                    {tab === "Supply network" && (
                      <>
                        <Button kind="category">Add category</Button>
                        <Button kind="supplier">Add supplier +</Button>
                      </>
                    )}
                    {tab === "Relationships" && (
                      <>
                        <Button kind="contact">Add contact</Button>
                        <Button kind="organization">Add organization +</Button>
                      </>
                    )}
                    {tab === "Decisions" && (
                      <>
                        <Button kind="task" row={opp}>
                          Assign validation +
                        </Button>
                        <Button kind="decision" row={opp}>
                          Record decision +
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
              {tab === "Overview" && (
                <>
                  <div className={styles.metrics}>
                    {[
                      [
                        "Open hypotheses",
                        data.opportunities.filter(
                          (o) =>
                            !["Rejected", "On Hold"].includes(v(o, "stage")),
                        ).length,
                        "No score is a prediction.",
                      ],
                      [
                        "Signals to review",
                        data.signals.filter(
                          (s) => s.review_status === "unreviewed",
                        ).length,
                        "Separate facts from interpretation.",
                      ],
                      [
                        "Supplier diligence",
                        data.suppliers.filter(
                          (s) =>
                            !["Approved", "Rejected"].includes(v(s, "stage")),
                        ).length,
                        "Human qualification required.",
                      ],
                      [
                        "Open actions",
                        activeTasks.length,
                        "Validation and relationship follow-ups.",
                      ],
                    ].map(([label, value, note]) => (
                      <article key={String(label)}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                        <small>{note}</small>
                      </article>
                    ))}
                  </div>
                  <div className={styles.twoColumns}>
                    <section className={styles.panel}>
                      <div className={styles.panelTitle}>
                        <h2>Priority hypotheses</h2>
                        <button onClick={() => setTab("Opportunities")}>
                          All opportunities →
                        </button>
                      </div>
                      {[...data.opportunities]
                        .filter(
                          (o) =>
                            !["Rejected", "On Hold"].includes(v(o, "stage")),
                        )
                        .sort((a, b) => metric(b.id).score - metric(a.id).score)
                        .slice(0, 5)
                        .map((o) => (
                          <button
                            className={styles.opportunityRow}
                            key={o.id}
                            onClick={() => {
                              setSelected(o.id);
                              setTab("Opportunities");
                            }}
                          >
                            <div>
                              <strong>{title(o)}</strong>
                              <span>
                                {v(o, "stage")} · {metric(o.id).confidence}%
                                confidence
                              </span>
                            </div>
                            <b>
                              {metric(o.id).score}
                              <small>/100</small>
                            </b>
                          </button>
                        ))}
                      {!data.opportunities.length && (
                        <p>
                          Start with a source-backed signal, then formulate a
                          testable hypothesis.
                        </p>
                      )}
                    </section>
                    <section className={styles.panel}>
                      <div className={styles.panelTitle}>
                        <h2>Next-action queue</h2>
                        <Button kind="task">Assign action +</Button>
                      </div>
                      <TaskList tasks={activeTasks} members={data.members} />
                    </section>
                  </div>
                  <section className={styles.panel}>
                    <div className={styles.panelTitle}>
                      <h2>Opportunity lifecycle</h2>
                      <span>
                        Decision rationale required at every transition
                      </span>
                    </div>
                    <div
                      className={styles.stages}
                      tabIndex={0}
                      role="region"
                      aria-label="Lifecycle stages"
                    >
                      {opportunityStages.map((s) => (
                        <div key={s}>
                          <strong>{count(s)}</strong>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                  <div className={styles.twoColumns}>
                    <section className={styles.panel}>
                      <h2>Evidence requiring attention</h2>
                      {data.signals
                        .filter(
                          (s) =>
                            s.review_status === "unreviewed" ||
                            s.confidence === "high",
                        )
                        .slice(0, 4)
                        .map((s) => (
                          <button
                            className={styles.recordButton}
                            key={s.id}
                            onClick={() => {
                              setTab("Signals");
                              setDetail(s);
                            }}
                          >
                            <strong>{title(s)}</strong>
                            <span>
                              {v(s, "publisher")} · {v(s, "confidence")}{" "}
                              confidence · {v(s, "review_status")}
                            </span>
                          </button>
                        ))}
                    </section>
                    <section className={styles.panel}>
                      <h2>Supplier documentation gaps</h2>
                      {data.suppliers
                        .filter(
                          (s) =>
                            s.stage !== "Approved" && s.stage !== "Rejected",
                        )
                        .slice(0, 4)
                        .map((s) => (
                          <button
                            className={styles.recordButton}
                            key={s.id}
                            onClick={() => {
                              setTab("Supply network");
                              setDetail(s);
                            }}
                          >
                            <strong>{supplierName(s)}</strong>
                            <span>
                              {v(s, "outstanding") ||
                                "Qualification evidence not yet complete."}
                            </span>
                          </button>
                        ))}
                    </section>
                  </div>
                </>
              )}
              {tab === "Signals" && (
                <>
                  <div className={styles.sourceStrip}>
                    {data.sources.map((source) => (
                      <div key={source.id}>
                        <strong>{v(source, "name")}</strong>
                        <span>
                          {source.approved
                            ? "Approved public source"
                            : "Manual source"}{" "}
                          ·{" "}
                          {source.last_ingested_at
                            ? `Last import ${when(source.last_ingested_at)}`
                            : "Not imported"}
                        </span>
                        <button
                          disabled={
                            !writer ||
                            !source.approved ||
                            source.adapter === "manual" ||
                            busy
                          }
                          onClick={() =>
                            void mutate({
                              operation: "ingest",
                              source_id: source.id,
                            })
                          }
                        >
                          Import latest
                        </button>
                      </div>
                    ))}
                    {!data.sources.length && (
                      <p>
                        Manual entry works immediately. Add a tracked source;
                        only approved adapters can fetch external content.
                      </p>
                    )}
                  </div>
                  <div className={styles.cards}>
                    {filtered(data.signals).map((signal) => (
                      <article className={styles.card} key={signal.id}>
                        <div className={styles.cardTop}>
                          <span>{v(signal, "industry")}</span>
                          <Badge row={signal} />
                        </div>
                        <h2>{title(signal)}</h2>
                        <p>{v(signal, "summary")}</p>
                        <div className={styles.facts}>
                          <span>
                            {v(signal, "evidence_type").replaceAll("_", " ")}
                          </span>
                          <span>
                            {v(signal, "reliability")} ·{" "}
                            {v(signal, "confidence")} confidence
                          </span>
                        </div>
                        <p className={styles.small}>
                          {v(signal, "publisher")} · Published{" "}
                          {when(signal.published_on)} · Collected{" "}
                          {when(signal.collected_at)}
                        </p>
                        <a
                          href={v(signal, "source_url")}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Original source →
                        </a>
                        <div className={styles.cardActions}>
                          <button onClick={() => setDetail(signal)}>
                            Review evidence
                          </button>
                          <Button kind="review_signal" row={signal}>
                            Record review
                          </Button>
                          <Button kind="opportunity" row={signal}>
                            Develop hypothesis →
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
              {tab === "Opportunities" && (
                <>
                  <div className={styles.opportunityLayout}>
                    <section className={styles.opportunityList}>
                      {filtered(data.opportunities).map((o) => (
                        <button
                          className={`${styles.opportunityRow} ${opp?.id === o.id ? styles.selected : ""}`}
                          key={o.id}
                          onClick={() => setSelected(o.id)}
                        >
                          <div>
                            <strong>{title(o)}</strong>
                            <span>
                              {v(o, "stage")} · {metric(o.id).confidence}%
                              confidence
                            </span>
                          </div>
                          <b>{metric(o.id).score}</b>
                        </button>
                      ))}
                    </section>
                    {opp && (
                      <section className={styles.panel}>
                        <div className={styles.cardTop}>
                          <Badge row={opp} />
                          <span>
                            {metric(opp.id).coverage}% weighted evidence
                            coverage
                          </span>
                        </div>
                        <h2>{title(opp)}</h2>
                        <p>{v(opp, "problem")}</p>
                        <div className={styles.cardActions}>
                          <Button kind="evaluation" row={opp}>
                            Evaluate scorecard
                          </Button>
                          <Button kind="evidence" row={opp}>
                            Link evidence
                          </Button>
                          <Button kind="task" row={opp}>
                            Assign validation
                          </Button>
                          <Button kind="decision" row={opp}>
                            Record decision
                          </Button>
                          <button onClick={() => setDetail(opp)}>
                            Full hypothesis →
                          </button>
                          <button
                            disabled={!writer || busy}
                            onClick={() => void analyze(opp)}
                          >
                            AI draft assistance
                          </button>
                        </div>
                        <div className={styles.scorecard}>
                          {criteria.map(([key, label]) => {
                            const e = evaluations(opp.id).find(
                              (e) => e.criterion === key,
                            );
                            return (
                              <div key={key}>
                                <span>{label}</span>
                                <b>
                                  {e?.score ?? "Unknown"}
                                  {e?.score != null ? " / 5" : ""}
                                </b>
                                <p>
                                  {e?.rationale ||
                                    "Missing information. This does not improve the score."}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        <p className={styles.small}>
                          Higher scores indicate stronger evidence under the
                          selected rubric, not predicted success. Regulatory
                          manageability and capital efficiency: 5 means lower
                          burden. Unknowns contribute zero and reduce
                          confidence.
                        </p>
                        <div className={styles.cardActions}>
                          <button
                            disabled={!writer || role !== "admin"}
                            onClick={() => open("weights")}
                          >
                            Configure weights
                          </button>
                        </div>
                      </section>
                    )}
                  </div>
                  {opp && (
                    <section className={styles.panel}>
                      <div className={styles.panelTitle}>
                        <h2>Connected evidence & relationships</h2>
                        <span>Select a node to inspect its record</span>
                      </div>
                      <Network
                        opportunity={opp}
                        data={data}
                        onSelect={setDetail}
                      />
                    </section>
                  )}
                </>
              )}
              {tab === "Supply network" && (
                <>
                  <div
                    className={styles.stages}
                    tabIndex={0}
                    role="region"
                    aria-label="Lifecycle stages"
                  >
                    {supplierStages.map((s) => (
                      <div key={s}>
                        <strong>
                          {data.suppliers.filter((x) => x.stage === s).length}
                        </strong>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                  <p className={styles.small}>
                    Qualification requires verified documentation, COA
                    availability, traceability, independent verification, and
                    documented human review of all six gates. A score cannot
                    approve a supplier.
                  </p>
                  <div className={styles.cards}>
                    {filtered(data.suppliers).map((s) => (
                      <article className={styles.card} key={s.id}>
                        <div className={styles.cardTop}>
                          <span>{v(s, "classification")}</span>
                          <Badge row={s} />
                        </div>
                        <h2>{supplierName(s)}</h2>
                        <p>
                          {v(s, "outstanding") ||
                            "No outstanding requirements recorded. This is not evidence of qualification."}
                        </p>
                        <p>
                          <strong>Next:</strong> {v(s, "next_action")}
                        </p>
                        <p className={styles.small}>
                          {v(s, "verification")} ·{" "}
                          {related("documents", "supplier_id", s.id).length}{" "}
                          private documents
                        </p>
                        <div className={styles.cardActions}>
                          <button
                            onClick={() =>
                              setDetail({ ...s, legal_name: supplierName(s) })
                            }
                          >
                            Diligence record
                          </button>
                          <Button kind="supplier" row={s}>
                            Update diligence
                          </Button>
                          <Button kind="supplier_stage" row={s}>
                            Human review
                          </Button>
                        </div>
                        <label className={styles.upload}>
                          Upload supporting document
                          <input
                            disabled={!writer || busy}
                            type="file"
                            accept="application/pdf,image/png,image/jpeg,text/plain"
                            onChange={(e) => void upload(e, s)}
                          />
                        </label>
                        {related("documents", "supplier_id", s.id).map(
                          (doc) => (
                            <div className={styles.document} key={doc.id}>
                              <a
                                href={`/api/intelligence/documents?id=${doc.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {v(doc, "name")} →
                              </a>
                              <span>
                                {doc.verified_at
                                  ? "Human-verified"
                                  : "Unverified"}
                              </span>
                              <Button kind="verify_document" row={doc}>
                                Verify
                              </Button>
                            </div>
                          ),
                        )}
                      </article>
                    ))}
                  </div>
                </>
              )}
              {tab === "Relationships" && (
                <div className={styles.cards}>
                  {filtered(data.organizations).map((org) => (
                    <article className={styles.card} key={org.id}>
                      <span className={styles.eyebrow}>{v(org, "kind")}</span>
                      <h2>{title(org)}</h2>
                      <p>{v(org, "location")}</p>
                      <p>{v(org, "notes")}</p>
                      {related("contacts", "organization_id", org.id).map(
                        (c) => (
                          <p key={c.id}>
                            <strong>{v(c, "name")}</strong> · {v(c, "role")}
                            <br />
                            {v(c, "email")}
                          </p>
                        ),
                      )}
                      <div className={styles.cardActions}>
                        <Button kind="contact" row={org}>
                          Add contact
                        </Button>
                        <Button kind="note" row={org}>
                          Log conversation
                        </Button>
                        <Button kind="task" row={org}>
                          Assign follow-up
                        </Button>
                        <Button kind="link" row={org}>
                          Link opportunity
                        </Button>
                      </div>
                      <div className={styles.timeline}>
                        {related("notes", "organization_id", org.id).map(
                          (note) => (
                            <article key={note.id}>
                              <time>{when(note.created_at)}</time>
                              <p>{v(note, "body")}</p>
                              <strong>{v(note, "next_action")}</strong>
                              {!!note.follow_up_on && (
                                <small>
                                  Follow up {when(note.follow_up_on)}
                                </small>
                              )}
                            </article>
                          ),
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
              {tab === "Decisions" && (
                <>
                  <section className={styles.panel}>
                    <h2>Validation experiments & next actions</h2>
                    <TaskList tasks={activeTasks} members={data.members} />
                  </section>
                  <div className={styles.twoColumns}>
                    <section className={styles.panel}>
                      <h2>Decision log</h2>
                      <div className={styles.timeline}>
                        {data.decisions.map((d) => (
                          <article key={d.id}>
                            <time>
                              {when(d.created_at)} ·{" "}
                              {v(
                                data.members.find((m) => m.id === d.created_by),
                                "display_name",
                              )}
                            </time>
                            <strong>
                              {title(
                                data.opportunities.find(
                                  (o) => o.id === d.opportunity_id,
                                ) ?? d,
                              )}{" "}
                              → {v(d, "stage")}
                            </strong>
                            <p>{v(d, "rationale")}</p>
                            <p>{v(d, "assumptions_changed")}</p>
                            {related(
                              "decision_evidence",
                              "decision_id",
                              d.id,
                            ).map((e) => {
                              const s = data.signals.find(
                                (s) => s.id === e.signal_id,
                              );
                              return s ? (
                                <a
                                  key={e.id}
                                  href={v(s, "source_url")}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {title(s)} →
                                </a>
                              ) : null;
                            })}
                          </article>
                        ))}
                      </div>
                    </section>
                    <section className={styles.panel}>
                      <h2>Activity history</h2>
                      <div className={styles.timeline}>
                        {data.activity.slice(0, 40).map((a) => (
                          <article key={a.id}>
                            <time>{when(a.occurred_at)}</time>
                            <strong>
                              {v(a, "event")} ·{" "}
                              {v(a, "entity_type").replace("intel_", "")}
                            </strong>
                            <p>
                              {v(a, "stage") ||
                                "Record updated. Inspect its current evidence and context."}
                            </p>
                          </article>
                        ))}
                      </div>
                    </section>
                  </div>
                </>
              )}
              {!["Overview", "Decisions"].includes(tab) &&
                !data[
                  {
                    Signals: "signals",
                    Opportunities: "opportunities",
                    "Supply network": "suppliers",
                    Relationships: "organizations",
                  }[tab] ?? "signals"
                ]?.length && (
                  <section className={styles.empty}>
                    <span>BEGIN WITH EVIDENCE</span>
                    <h2>No records yet.</h2>
                    <p>
                      Create a source-backed signal, develop a hypothesis, and
                      assign a concrete validation action.
                    </p>
                  </section>
                )}
              <footer className={styles.workspaceFooter}>
                <span>
                  SIONA EVOLUTION ENGINE · PRIVATE /{" "}
                  {preview ? "SYNTHETIC PREVIEW" : "LIVE WORKSPACE"}
                </span>
                <div>
                  <button
                    disabled={!writer || busy}
                    onClick={() => void mutate({ operation: "seed_demo" })}
                  >
                    Load clearly labeled synthetic data
                  </button>
                  <button
                    disabled={!writer || busy}
                    onClick={() => {
                      if (
                        confirm(
                          "Remove only synthetic records you created? Real records and records referencing demo data are protected.",
                        )
                      )
                        void mutate({ operation: "clear_demo" });
                    }}
                  >
                    Remove my demo data
                  </button>
                </div>
              </footer>
            </>
          )}
        </div>
        <dialog
          ref={dialog}
          className={styles.dialog}
          onCancel={() => setForm(null)}
          onClose={() => setForm(null)}
        >
          {form && (
            <form onSubmit={submit}>
              <div className={styles.panelTitle}>
                <h2>{form.kind.replaceAll("_", " ")}</h2>
                <button
                  type="button"
                  onClick={() => setForm(null)}
                  aria-label="Close form"
                >
                  ✕
                </button>
              </div>
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              {form.kind === "evaluation" ? (
                <>
                  <p className={styles.small}>
                    0–5; leave unknowns blank. Explain every score or missing
                    item. Regulatory/capital criteria score manageability and
                    efficiency, so higher means less burden.
                  </p>
                  {criteria.map(([key, label]) => {
                    const e = evaluations(form.row!.id).find(
                      (e) => e.criterion === key,
                    );
                    return (
                      <fieldset key={key}>
                        <legend>{label}</legend>
                        <label>
                          Score
                          <select name={key} defaultValue={e?.score ?? ""}>
                            <option value="">Unknown</option>
                            {[0, 1, 2, 3, 4, 5].map((n) => (
                              <option key={n}>{n}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Evidence and reasoning
                          <textarea
                            name={`${key}_reason`}
                            required
                            minLength={10}
                            defaultValue={
                              e?.rationale ??
                              "Missing evidence; validation is required."
                            }
                          />
                        </label>
                      </fieldset>
                    );
                  })}
                </>
              ) : form.kind === "weights" ? (
                <>
                  <p>
                    Weights are relative; unknown criteria remain in the
                    denominator.
                  </p>
                  {criteria.map(([key, label]) => (
                    <label key={key}>
                      {label}
                      <input
                        type="number"
                        name={key}
                        min={0}
                        max={100}
                        step="0.1"
                        required
                        defaultValue={
                          (data.weights.find((w) => w.criterion === key)
                            ?.weight as number) ?? 10
                        }
                      />
                    </label>
                  ))}
                </>
              ) : (
                <>
                  {form.kind === "supplier_stage" && (
                    <p className={styles.small}>
                      Qualified / Approved require all six human-reviewed gates,
                      independent verification, COA, traceability, quality
                      evidence, and at least one privately uploaded, verified
                      supporting document. No automatic approval.
                    </p>
                  )}
                  {forms().map((field) => {
                    let defaultValue =
                      form.kind === "supplier"
                        ? v(form.row, field.key)
                        : (field.value ?? "");
                    if (field.key === "owner_id") defaultValue = userId;
                    if (field.key === "opportunity_id")
                      defaultValue =
                        form.row &&
                        data.opportunities.some((o) => o.id === form.row?.id)
                          ? form.row.id
                          : (opp?.id ?? "");
                    if (
                      field.key === "organization_id" &&
                      form.row &&
                      data.organizations.some((o) => o.id === form.row?.id)
                    )
                      defaultValue = form.row.id;
                    if (
                      field.key === "signal_ids" &&
                      form.row &&
                      data.signals.some((s) => s.id === form.row?.id)
                    )
                      defaultValue = form.row.id;
                    return (
                      <label key={field.key}>
                        {field.label}
                        {field.type === "textarea" ? (
                          <textarea
                            name={field.key}
                            required={field.required}
                            defaultValue={defaultValue}
                            maxLength={5000}
                          />
                        ) : field.type === "select" ||
                          field.type === "multiple" ? (
                          <select
                            name={field.key}
                            required={field.required}
                            multiple={field.type === "multiple"}
                            defaultValue={
                              field.type === "multiple"
                                ? defaultValue
                                  ? [defaultValue]
                                  : []
                                : defaultValue
                            }
                          >
                            <option value="">
                              {field.required ? "Select…" : "Not specified"}
                            </option>
                            {field.options?.map(([id, label]) => (
                              <option key={id} value={id}>
                                {label}
                              </option>
                            ))}
                          </select>
                        ) : field.type === "checkbox" ? (
                          <input
                            name={field.key}
                            type="checkbox"
                            defaultChecked={!!form.row?.[field.key]}
                          />
                        ) : (
                          <input
                            name={field.key}
                            type={field.type}
                            required={field.required}
                            defaultValue={defaultValue}
                            maxLength={field.type === "date" ? undefined : 5000}
                          />
                        )}
                      </label>
                    );
                  })}
                </>
              )}
              <button className={styles.primary} disabled={busy || !writer}>
                {busy ? "Saving…" : "Save to workspace →"}
              </button>
            </form>
          )}
        </dialog>
        {detail && (
          <div
            className={styles.drawer}
            role="dialog"
            aria-modal="false"
            aria-label="Record details"
          >
            <div className={styles.panelTitle}>
              <h2>{title(detail)}</h2>
              <button
                onClick={() => setDetail(null)}
                aria-label="Close details"
              >
                ✕
              </button>
            </div>
            {Object.entries(detail)
              .filter(
                ([key, value]) =>
                  value != null &&
                  ![
                    "id",
                    "created_by",
                    "updated_by",
                    "demo_batch_id",
                    "organization_id",
                    "owner_id",
                    "source_id",
                  ].includes(key),
              )
              .map(([key, value]) => (
                <div key={key}>
                  <h3>{key.replaceAll("_", " ")}</h3>
                  {key === "source_url" ? (
                    <a
                      href={String(value)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Original source →
                    </a>
                  ) : (
                    <p>
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </p>
                  )}
                </div>
              ))}
          </div>
        )}
      </main>
    </ActionContext.Provider>
  );
}
