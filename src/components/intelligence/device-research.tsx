import {
  depthLabels,
  familyResearch,
  sourceById,
  gapLabels,
  editorialLabels,
  componentIsVerified,
} from "@/lib/intelligence/device-library";
import styles from "./device-research.module.css";

const reviewLabel = (value: keyof typeof editorialLabels) =>
  editorialLabels[value];
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
    investigations,
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
              ? components.every((item) => componentIsVerified(item))
                ? "Verified component evidence recorded"
                : "Identifier located only"
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
      {investigations.length > 0 && (
        <div className={styles.investigation}>
          <h3>Exact-component verification checklist</h3>
          <p className={styles.note}>
            Record observations and partial findings are not completed labeling
            checks. Open a topic for sources, limits and the next question to
            ask.
          </p>
          {investigations.map((item) => (
            <details key={item.id}>
              <summary>
                {
                  {
                    identity: "Identity and role",
                    materials: "Materials and surface treatments",
                    fixation: "Fixation",
                    compatibility: "Tibial and bearing compatibility",
                    mri: "MRI labeling and conditions",
                    "regulatory-safety":
                      "Regulatory records and safety notices",
                  }[item.topic]
                }{" "}
                ·{" "}
                {
                  {
                    "record-observation": "Identifier evidence",
                    partial: "Partial evidence — unresolved",
                    unresolved: "Unresolved",
                    supported: "Supported within stated scope",
                  }[item.outcome]
                }
              </summary>
              <p>
                <strong>Research gap:</strong> {gapLabels[item.gapState]}
              </p>
              <p>
                <strong>Why it matters:</strong> {item.whyItMatters}
              </p>
              {item.claimIds.map((id) => {
                const claim = claims.find((entry) => entry.id === id)!;
                return (
                  <article className={styles.claim} key={id}>
                    <span className={styles.label}>
                      {claim.label} · {reviewLabel(claim.editorialStatus)}
                    </span>
                    <h4>{claim.text}</h4>
                    <p>
                      <strong>Applies to:</strong> {claim.applicability}{" "}
                      {claim.geography}
                    </p>
                    <p>
                      <strong>Limits:</strong> {claim.limitations}
                    </p>
                    {claim.citations.length === 0 && (
                      <p>
                        No authoritative answer established; this field remains
                        unresolved.
                      </p>
                    )}
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
                            <span className={styles.srOnly}>
                              {" "}
                              (opens a new tab)
                            </span>
                          </a>
                          <p className={styles.note}>
                            Passage: {citation.locator}. Revision/date:{" "}
                            {source.publicationOrRevision ?? "Not established"};{" "}
                            {source.dateNote}. Access: {source.access}. Claim
                            checked {claim.checkedOn}.
                          </p>
                        </div>
                      );
                    })}
                  </article>
                );
              })}
              <p>
                <strong>Internal research — searches / paths checked:</strong>{" "}
                {item.searched.join("; ")}
              </p>
              <p>
                <strong>Access and scope barrier:</strong> {item.barrier}
              </p>
              <p>
                <strong>Document still needed:</strong> {item.documentNeeded}
              </p>
              <p>
                <strong>Next feasible retrieval route:</strong>{" "}
                {item.nextRetrievalRoute}
              </p>
              <p>
                <strong>Ask your care team:</strong> {item.careTeamQuestion}
              </p>
              <p className={styles.note}>
                Investigation checked {item.checkedOn}. No assembly verified.
              </p>
            </details>
          ))}
        </div>
      )}
      <details>
        <summary>Discovery and inclusion record</summary>
        <p>
          <strong>Family candidate:</strong> {family.name}. Known family
          aliases: {family.discovery.aliases.join("; ")}. Manufacturer:{" "}
          {family.manufacturer}. Labeler of the identified example:{" "}
          {components.map((item) => item.labeler).join("; ")}.
        </p>
        <p>
          <strong>Category and role:</strong> {family.category}.{" "}
          {family.purpose}
        </p>
        <p>
          <strong>Availability:</strong> {family.discovery.availability}.{" "}
          {family.discovery.availabilityScope}
        </p>
        <p>
          <strong>Reason to investigate:</strong> {family.reasonForInclusion}
        </p>
        <p>
          <strong>Internal next action:</strong> {family.discovery.nextAction}
        </p>
        <p className={styles.note}>
          Discovery recorded {family.discovery.discoveredOn}; {family.geography}
          . This is research prioritization, not a demand or market-share claim.
        </p>
        <a
          href={sourceById(family.discovery.sourceId).url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Discovery source →
          <span className={styles.srOnly}> (opens a new tab)</span>
        </a>
      </details>
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
          <article
            id={`claim-${claim.id}`}
            key={claim.id}
            className={styles.claim}
          >
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
            {claim.relatedClaims?.map((relation) => (
              <p key={relation.claimId}>
                <strong>
                  {relation.relationship === "scope-difference"
                    ? "Different evidence scope"
                    : "Conflicting assertion retained"}
                  :
                </strong>{" "}
                {relation.explanation}{" "}
                <a href={`#claim-${relation.claimId}`}>
                  Compare the retained assertion →
                </a>
              </p>
            ))}
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
                ...(study.denominators ?? []).map((item) => [
                  item.label,
                  String(item.count),
                ]),
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
        {sessions.some((session) => session.familyIds.length > 1) && (
          <p className={styles.note}>
            Earlier shared research sessions are retained in maintainer history.
            The logs below contain this family’s research only.
          </p>
        )}
        {sessions
          .filter((session) => session.familyIds.length === 1)
          .map((session) => (
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
