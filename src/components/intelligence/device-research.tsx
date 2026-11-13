import {
  depthLabels,
  familyResearch,
  sourceById,
} from "@/lib/intelligence/device-library";
import styles from "./device-research.module.css";

const reviewLabel = (value: string) =>
  value === "needs-review"
    ? "Needs editorial review"
    : value === "reviewed"
      ? "Editorial review recorded"
      : "Draft";
export function DeviceResearch({ familyId }: { familyId: string }) {
  const record = familyResearch(familyId);
  if (!record) return null;
  const {
    family,
    components,
    claims,
    questions,
    sources,
    studies,
    safetyNotices,
    sessions,
    configurations,
  } = record;
  return (
    <section
      id="device-research"
      tabIndex={-1}
      className={styles.record}
      aria-labelledby="research-heading"
    >
      <p className={styles.eyebrow}>SOURCED DEVICE LIBRARY / RESEARCH RECORD</p>
      <h2 id="research-heading">{family.name} research record.</h2>
      <p className={styles.intro}>
        {family.purpose} {family.summary}
      </p>
      <dl className={styles.scope}>
        <div>
          <dt>Research depth</dt>
          <dd>{depthLabels[family.depth]}</dd>
        </div>
        <div>
          <dt>Component status</dt>
          <dd>
            {components.length
              ? "Identifier located only"
              : "No identifier record located"}
          </dd>
        </div>
        <div>
          <dt>Configuration status</dt>
          <dd>
            {configurations.some((item) => item.status === "verified")
              ? "Verified entry recorded"
              : "No verified assembly"}
          </dd>
        </div>
        <div>
          <dt>Editorial readiness</dt>
          <dd>{reviewLabel(family.editorialStatus)}</dd>
        </div>
      </dl>
      <p className={styles.note}>
        Research depth describes the scope of this entry. It is not a device
        quality, safety or completeness score. A located identifier does not
        establish materials, current labeling or compatibility.
      </p>
      <details>
        <summary>
          Family, component and configuration: what is established?
        </summary>
        <p>
          <strong>Family overview:</strong> {family.name} ·{" "}
          {family.manufacturer} · {family.category} · {family.geography}. Family
          review checked {family.checkedOn}.
        </p>
        <p>
          <strong>Why included:</strong> {family.reasonForInclusion}
        </p>
        {components.map((component) => (
          <div className={styles.component} key={component.id}>
            <h3>Identified component: {component.model}</h3>
            <p>
              {component.role} · DI {component.di}. Identity checked{" "}
              {component.checkedOn}; database record version{" "}
              {component.recordDate}.
            </p>
            <p>
              Current labeling, materials, fixation, compatibility and full
              safety review are not verified. This entry has not reached
              verified-component depth.
            </p>
            <a
              href={sourceById(component.sourceId).url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Original identifier record →
              <span className={styles.srOnly}> (opens a new tab)</span>
            </a>
          </div>
        ))}
        <p>
          <strong>Configuration:</strong> no assembly is inferred from these
          records. Candidate components require documented compatibility before
          any configuration can be called verified.
        </p>
      </details>
      <details>
        <summary>Claims, evidence labels and source passages</summary>
        <p>
          Each claim carries its own subject, applicability, limitations and
          review status. A family-level material option does not identify the
          composition of another component.
        </p>
        {claims.map((claim) => (
          <article key={claim.id} className={styles.claim}>
            <span className={styles.label}>
              {claim.label} · {reviewLabel(claim.editorialStatus)}
            </span>
            <h3>{claim.text}</h3>
            <dl>
              <div>
                <dt>Subject</dt>
                <dd>
                  {claim.subject.kind}: {claim.subject.id}
                </dd>
              </div>
              <div>
                <dt>Applies to</dt>
                <dd>
                  {claim.applicability} {claim.geography}
                </dd>
              </div>
              <div>
                <dt>Limits</dt>
                <dd>{claim.limitations}</dd>
              </div>
              <div>
                <dt>Checked</dt>
                <dd>{claim.checkedOn}</dd>
              </div>
            </dl>
            {claim.citations.map((citation) => {
              const source = sourceById(citation.sourceId);
              return (
                <div key={citation.sourceId + citation.locator}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.title} →
                    <span className={styles.srOnly}> (opens a new tab)</span>
                  </a>
                  <p className={styles.note}>Passage: {citation.locator}</p>
                </div>
              );
            })}
            {claim.citations.length === 0 && (
              <p>
                No supporting source established. This remains an unknown, not a
                negative finding.
              </p>
            )}
          </article>
        ))}
      </details>
      <details>
        <summary>Clinical comparisons and scoped safety history</summary>
        {studies.length === 0 && (
          <p>No clinical comparison has been assessed for this entry.</p>
        )}
        {studies.map((study) => (
          <article className={styles.claim} key={study.id}>
            <h3>{study.configuration}</h3>
            <dl>
              {[
                ["Population", study.population],
                [
                  "Design & sample",
                  `${study.design}; ${study.sampleSize} participants`,
                ],
                [
                  "Comparator & follow-up",
                  `${study.comparator}; ${study.followUp}`,
                ],
                ["Outcome", study.outcome],
                ["Finding", study.finding],
                ["Uncertainty", study.uncertainty],
                ["Funding / conflicts", study.funding],
                ["Limitations", study.limitations],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt>{key}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p>
              {reviewLabel(study.editorialStatus)}.{" "}
              <a
                href={sourceById(study.sourceId).url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read study →
                <span className={styles.srOnly}> (opens a new tab)</span>
              </a>
            </p>
          </article>
        ))}
        {safetyNotices.map((notice) => (
          <article className={styles.claim} key={notice.id}>
            <h3>Historical notice: {notice.id.toUpperCase()}</h3>
            <p>{notice.affectedScope}</p>
            <p>{notice.status}</p>
            <p>
              <strong>Match to example: not established.</strong>{" "}
              {notice.limitation}
            </p>
            <a
              href={sourceById(notice.sourceId).url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Original safety notice →
              <span className={styles.srOnly}> (opens a new tab)</span>
            </a>
          </article>
        ))}
        <p>
          These are scoped research records, not an exhaustive safety or
          registry review.
        </p>
      </details>
      <details>
        <summary>Open questions and next research steps</summary>
        <ol className={styles.questions}>
          {questions.map((question) => (
            <li key={question.id}>
              <strong>{question.question}</strong>
              <p>{question.nextStep}</p>
              <span className={styles.note}>
                Research priority: {question.priority.replaceAll("-", " ")}
              </span>
            </li>
          ))}
        </ol>
      </details>
      <details>
        <summary>Source register and search limitations</summary>
        {sources.map((source) => (
          <article className={styles.source} key={source.id}>
            <h3>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.title} →
                <span className={styles.srOnly}> (opens a new tab)</span>
              </a>
            </h3>
            <p>
              Publication / revision:{" "}
              {source.publicationOrRevision ?? "Not established"}.{" "}
              {source.dateNote}. Checked {source.checkedOn}. Access:{" "}
              {source.access}.
            </p>
            <p>{source.limitation}</p>
          </article>
        ))}
        {sessions.map((session) => (
          <div className={styles.claim} key={session.id}>
            <h3>Research session · {session.date}</h3>
            <p>Search terms: {session.terms.join("; ")}</p>
            {session.inaccessible.map((item) => (
              <p key={item.sourceId}>
                <strong>Access limitation:</strong>{" "}
                {sourceById(item.sourceId).title}: {item.reason}
              </p>
            ))}
            <ul>
              {session.limitations.map((limit) => (
                <li key={limit}>{limit}</li>
              ))}
            </ul>
          </div>
        ))}
      </details>
    </section>
  );
}
