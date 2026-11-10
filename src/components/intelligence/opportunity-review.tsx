import type { ReactNode } from "react";
import {
  criteria,
  scoreOpportunity,
  textValue as v,
  type Evaluation,
  type Row,
  type WorkspaceData,
} from "@/lib/intelligence/model";
import styles from "./workspace.module.css";

type Actions = Record<
  | "hypothesis"
  | "evidence"
  | "evaluation"
  | "weights"
  | "experiment"
  | "decision",
  ReactNode
>;
const steps = [
  "Hypothesis",
  "Evidence",
  "Scorecard",
  "Risks",
  "Experiments",
  "Decisions",
];
const date = (value: unknown) =>
  value
    ? new Date(String(value)).toLocaleDateString("en-US", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not recorded";
const sourceLink = (signal: Row) =>
  /^https?:\/\//i.test(v(signal, "source_url")) ? (
    <a href={v(signal, "source_url")} target="_blank" rel="noopener noreferrer">
      Original source →
    </a>
  ) : (
    <span>Source URL unavailable</span>
  );

/** Presents existing records together; never computes legal clearance or writes data. */
export function OpportunityReview({
  opportunity: o,
  data,
  actions,
  inspect,
  taskAction,
  evidenceAction,
}: {
  opportunity: Row;
  data: WorkspaceData;
  actions: Actions;
  inspect: (row: Row) => void;
  taskAction: (row: Row) => ReactNode;
  evidenceAction: (row: Row) => ReactNode;
}) {
  const evaluations = data.evaluations.filter(
    (e) => e.opportunity_id === o.id,
  ) as unknown as Evaluation[];
  const weights = data.weights as unknown as {
    criterion: string;
    weight: number;
  }[];
  const metric = scoreOpportunity(evaluations, weights);
  const unknowns = criteria.filter(
    ([key]) =>
      !evaluations.some(
        (e) =>
          e.criterion === key &&
          e.score != null &&
          (e.rationale?.trim().length ?? 0) >= 10,
      ),
  );
  const evidence = data.evidence.filter((e) => e.opportunity_id === o.id);
  const signals = data.signals.filter((s) =>
    evidence.some((e) => e.signal_id === s.id),
  );
  const reviewed = signals.filter((s) => s.review_status === "reviewed").length;
  const tasks = data.tasks
    .filter((t) => t.opportunity_id === o.id)
    .sort((a, b) =>
      (v(a, "due_on") || "9999").localeCompare(v(b, "due_on") || "9999"),
    );
  const next = tasks.find(
    (t) => !["Completed", "Cancelled"].includes(v(t, "status")),
  );
  const decisions = data.decisions
    .filter((d) => d.opportunity_id === o.id)
    .sort((a, b) => v(b, "created_at").localeCompare(v(a, "created_at")));
  const field = (label: string, key: string) => (
    <div key={key}>
      <dt>{label}</dt>
      <dd>{v(o, key) || "Unknown — record evidence before assessing."}</dd>
    </div>
  );
  const sectionHead = (step: number, title: string, action?: ReactNode) => (
    <div className={styles.reviewSectionHead}>
      <div>
        <span className={styles.eyebrow}>0{step} / VALIDATION WORKFLOW</span>
        <h3 id={`${steps[step - 1].toLowerCase()}-heading`}>{title}</h3>
      </div>
      <div className={styles.cardActions}>{action}</div>
    </div>
  );
  return (
    <article
      className={styles.review}
      aria-label="Opportunity validation review"
    >
      <header className={styles.reviewHero}>
        <div className={styles.cardTop}>
          <span className={styles.badge}>{v(o, "stage") || "Discovered"}</span>
          {!!o.demo_batch_id && (
            <span className={styles.synthetic}>SYNTHETIC</span>
          )}
          {!!o.planning_case && (
            <span className={styles.synthetic}>
              PLANNING CASE · UNVALIDATED · NOT SAVED
            </span>
          )}
        </div>
        <h2>{v(o, "title")}</h2>
        <p>
          Build the case. Challenge the assumptions. Decide what to test next.
        </p>
        <dl className={styles.reviewMetrics}>
          <div>
            <dt>Weighted score</dt>
            <dd>
              {metric.score}
              <small> / 100</small>
            </dd>
          </div>
          <div>
            <dt>Assessment coverage</dt>
            <dd>
              {metric.coverage}
              <small>%</small>
            </dd>
          </div>
          <div>
            <dt>Confidence heuristic</dt>
            <dd>
              {metric.confidence}
              <small>%</small>
            </dd>
          </div>
          <div>
            <dt>Criteria needing evidence</dt>
            <dd>
              {unknowns.length}
              <small> / 9</small>
            </dd>
          </div>
        </dl>
        <p className={styles.small}>
          Coverage measures scored criteria with reasoning, not verified
          evidence. Confidence is a heuristic, not a probability of success.
          Unknowns contribute zero; an evidenced zero means an unfavorable
          finding.
        </p>
        <div className={styles.reviewNext}>
          <span className={styles.eyebrow}>NEXT VALIDATION STEP</span>
          <strong>
            {next ? v(next, "title") : "Define the next experiment"}
          </strong>
          <p>
            {next
              ? v(next, "success_criteria")
              : "Choose the most consequential unknown, define what would change your mind, and assign an owner and a date."}
          </p>
          {next ? taskAction(next) : actions.experiment}
        </div>
      </header>
      <nav className={styles.reviewNav} aria-label="Opportunity review steps">
        {steps.map((step, i) => (
          <a key={step} href={`#opportunity-${step.toLowerCase()}`}>
            <span>0{i + 1}</span>
            {step}
          </a>
        ))}
      </nav>

      <section
        id="opportunity-hypothesis"
        tabIndex={-1}
        className={styles.reviewSection}
        aria-labelledby="hypothesis-heading"
      >
        <div>{sectionHead(1, "Hypothesis", actions.hypothesis)}</div>
        <dl className={styles.reviewFacts}>
          {[
            ["Problem", "problem"],
            ["Affected users", "affected"],
            ["Proposed offer", "proposition"],
            ["Customers and potential payers", "customers"],
            ["Partners and suppliers", "partners"],
            ["Economics hypothesis", "revenue"],
          ].map(([label, key]) => field(label, key))}
        </dl>
      </section>

      <section
        id="opportunity-evidence"
        tabIndex={-1}
        className={styles.reviewSection}
        aria-labelledby="evidence-heading"
      >
        <div>{sectionHead(2, "Evidence", actions.evidence)}</div>
        <p className={styles.small}>
          {reviewed} of {signals.length} linked sources reviewed. Source
          quality, review status and interpretation are separate. Seek
          contradicting evidence as well as support.
        </p>
        <div className={styles.reviewRecords}>
          {evidence.map((link) => {
            const s = data.signals.find((s) => s.id === link.signal_id);
            return (
              <article key={link.id}>
                {s ? (
                  <>
                    <h4>{v(s, "title")}</h4>
                    <div className={styles.facts}>
                      <span>
                        {v(s, "evidence_type").replaceAll("_", " ") ||
                          "Unclassified"}
                      </span>
                      <span>{v(s, "reliability") || "Unassessed"} source</span>
                      <span>{v(s, "review_status") || "unreviewed"}</span>
                    </div>
                    <p>{v(s, "summary")}</p>
                    <p className={styles.small}>
                      {v(s, "publisher")} · Published {date(s.published_on)} ·
                      Collected {date(s.collected_at)}
                    </p>
                    <p className={styles.small}>
                      Reliability: {v(s, "reliability_notes") || "Not assessed"}
                    </p>
                    {!!s.review_notes && (
                      <p className={styles.small}>
                        Review findings: {v(s, "review_notes")}
                      </p>
                    )}
                  </>
                ) : (
                  <h4>Linked source unavailable in this view</h4>
                )}
                <p className={styles.reviewInterpretation}>
                  <strong>Relevance / challenge:</strong>{" "}
                  {v(link, "interpretation") ||
                    "Interpretation missing. Record whether this supports, contradicts or only contextualizes the hypothesis."}
                </p>
                {s && (
                  <div className={styles.cardActions}>
                    {sourceLink(s)}
                    <button onClick={() => inspect(s)}>Inspect evidence</button>
                    {evidenceAction(s)}
                  </div>
                )}
              </article>
            );
          })}
          {!evidence.length && (
            <p>
              No linked evidence. Market demand, economics and feasibility
              remain unvalidated until supported by relevant findings.
            </p>
          )}
        </div>
      </section>

      <section
        id="opportunity-scorecard"
        tabIndex={-1}
        className={styles.reviewSection}
        aria-labelledby="scorecard-heading"
      >
        <div>
          {sectionHead(
            3,
            "Nine-criterion scorecard",
            <>
              {actions.evaluation}
              {actions.weights}
            </>,
          )}
        </div>
        <p className={styles.small}>
          Higher means more favorable. Regulatory manageability and capital
          efficiency score lower burden. No aggregate score clears a regulatory
          or authorization blocker.
        </p>
        <div className={styles.scorecard}>
          {criteria.map(([key, label]) => {
            const e = evaluations.find((e) => e.criterion === key);
            return (
              <div key={key}>
                <span>{label}</span>
                <b>{e?.score == null ? "Unknown" : `${e.score} / 5`}</b>
                <p>
                  {e?.rationale ||
                    "Evidence and reasoning are missing. Define a validation action."}
                </p>
                {e?.score != null && (e.rationale?.trim().length ?? 0) < 10 && (
                  <p>Reasoning incomplete — excluded from coverage.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section
        id="opportunity-risks"
        tabIndex={-1}
        className={styles.reviewSection}
        aria-labelledby="risks-heading"
      >
        <div>{sectionHead(4, "Risks, blockers and unknowns")}</div>
        <div className={styles.reviewCaution}>
          <strong>
            Regulatory / operational review:{" "}
            {v(o, "barriers")
              ? "required — assess recorded barriers"
              : "not recorded"}
          </strong>
          <p>
            {v(o, "barriers") ||
              "No barriers recorded does not mean cleared. Establish the exact intended use, customer, jurisdiction and operating requirements."}
          </p>
        </div>
        <dl className={styles.reviewFacts}>
          {field("Assumptions to test", "assumptions")}
          {field("What would invalidate this opportunity?", "invalidation")}
        </dl>
        <p className={styles.small}>
          Unassessed criteria:{" "}
          {unknowns.length
            ? unknowns.map(([, label]) => label).join(" · ")
            : "None. Recheck source quality and unresolved barriers before deciding."}
        </p>
        <p className={styles.small}>
          These are recorded concerns, not an automated regulatory
          determination. Use a validation task to investigate and a decision to
          document what changed.
        </p>
      </section>

      <section
        id="opportunity-experiments"
        tabIndex={-1}
        className={styles.reviewSection}
        aria-labelledby="experiments-heading"
      >
        <div>
          {sectionHead(5, "Experiments and outcomes", actions.experiment)}
        </div>
        <div className={styles.reviewRecords}>
          {tasks.map((t) => (
            <article key={t.id}>
              <div className={styles.cardTop}>
                <h4>{v(t, "title")}</h4>
                <span className={styles.badge}>{v(t, "status")}</span>
              </div>
              <p>{v(t, "details") || "Experiment design not recorded."}</p>
              <p>
                <strong>Validate / invalidate:</strong>{" "}
                {v(t, "success_criteria")}
              </p>
              <p className={styles.small}>
                Owner:{" "}
                {v(
                  data.members.find((m) => m.id === t.owner_id),
                  "display_name",
                ) || "Unassigned"}{" "}
                · Due: {date(t.due_on)}
              </p>
              <p>
                <strong>Outcome:</strong>{" "}
                {v(t, "result") ||
                  "Not recorded. Completing a task is not evidence that the hypothesis passed."}
              </p>
              <div className={styles.cardActions}>
                <button onClick={() => inspect(t)}>Inspect experiment</button>
                {taskAction(t)}
              </div>
            </article>
          ))}
          {!tasks.length && (
            <p>
              No experiments assigned to this opportunity. Define a test with an
              owner, deadline and success/invalidation criteria.
            </p>
          )}
        </div>
      </section>

      <section
        id="opportunity-decisions"
        tabIndex={-1}
        className={styles.reviewSection}
        aria-labelledby="decisions-heading"
      >
        <div>{sectionHead(6, "Decision history", actions.decision)}</div>
        <p className={styles.small}>
          Continue, hold or reject through the existing stage decision. Record
          evidence, reasoning and changes to assumptions; a score never advances
          an opportunity automatically.
        </p>
        <div className={styles.reviewRecords}>
          {decisions.map((d) => (
            <article key={d.id}>
              <h4>{v(d, "stage")}</h4>
              <p>{v(d, "rationale")}</p>
              <p>
                {v(d, "assumptions_changed") ||
                  "No assumption changes recorded."}
              </p>
              <p className={styles.small}>
                {date(d.created_at)} ·{" "}
                {v(
                  data.members.find((m) => m.id === d.created_by),
                  "display_name",
                ) || "Recorded workspace member"}
              </p>
              {data.decision_evidence
                .filter((e) => e.decision_id === d.id)
                .map((e) => {
                  const s = data.signals.find((s) => s.id === e.signal_id);
                  return s ? (
                    <p key={e.id}>
                      {v(s, "title")} · {sourceLink(s)}
                    </p>
                  ) : (
                    <p key={e.id}>
                      Decision evidence unavailable in this view.
                    </p>
                  );
                })}
            </article>
          ))}
          {!decisions.length && (
            <p>
              No decision recorded. This hypothesis has not been advanced by a
              recorded review.
            </p>
          )}
        </div>
      </section>
    </article>
  );
}
