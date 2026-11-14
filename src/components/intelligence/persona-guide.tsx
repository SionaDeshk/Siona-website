import {
  deviceLibrary,
  claimById,
  sourceById,
} from "@/lib/intelligence/device-library";
import styles from "./persona-guide.module.css";

import {
  consumer,
  iqProfessional,
  iqPatient,
  iqShort,
  iqTechnique,
  trial,
  choices,
  materials,
  technologies,
  sensorMetrics,
} from "@/lib/intelligence/device-library/persona-content";

const personaStudy = deviceLibrary.studies.find(
  (item) => item.id === "persona-nexgen-rct",
)!;
const historicalNotice = deviceLibrary.safetyNotices.find(
  (item) => item.id === "z-1266-2015",
)!;

function Source({
  href,
  children = "Read the source",
}: {
  href: string;
  children?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children} <span aria-hidden="true">→</span>
      <span className={styles.srOnly}> (opens a new tab)</span>
    </a>
  );
}

export function PersonaGuide() {
  return (
    <section
      id="persona-options"
      tabIndex={-1}
      aria-labelledby="persona-options-heading"
      className={styles.guide}
    >
      <div className={styles.heading}>
        <p className={styles.eyebrow}>PERSONA / UNDERSTAND YOUR OPTIONS</p>
        <h2 id="persona-options-heading">One family. Different choices.</h2>
        <p>
          The implant, surgical tools and recovery support answer different
          questions. Explore the options, then confirm what is actually proposed
          with your care team.
        </p>
      </div>
      <div className={styles.scope}>
        <strong>Family-level education · U.S. context</strong>
        <p>
          Source-specific check dates are listed in the research record. This is
          a research example, not your treatment plan. Current exact-model
          labeling, compatibility and local availability still need
          verification. Undated web pages are not controlled instructions for
          use.
        </p>
      </div>
      <nav className={styles.links} aria-label="Persona guide topics">
        <a href="#persona-configuration">Configuration</a>
        <a href="#persona-materials">Materials</a>
        <a href="#persona-technology">Supporting technology</a>
        <a href="#persona-iq-feature">The sensor stem</a>
        <a href="#persona-findings">Claims & evidence</a>
      </nav>
      <div id="persona-configuration" tabIndex={-1} className={styles.block}>
        <h3>Start with the configuration.</h3>
        <p className={styles.intro}>
          “Personalized” needs an explanation of the actual choices. A family
          name is not a complete component list.
        </p>
        <div className={styles.grid}>
          {choices.map((item) => (
            <article key={item.title}>
              <span className={styles.label}>{item.label}</span>
              <h4>{item.title}</h4>
              <p>{item.summary}</p>
              <details>
                <summary>Tradeoff & question to ask</summary>
                <p>
                  <strong>Aim and practical tradeoff:</strong> {item.detail}
                </p>
                <p>
                  <strong>Evidence scope:</strong> {item.applicability} This is
                  a manufacturer proposition, not proof of a patient-outcome
                  advantage.
                </p>
                <blockquote>{item.question}</blockquote>
                <Source href={item.href} />
              </details>
            </article>
          ))}
        </div>
        <div className={styles.unknown}>
          <span className={styles.label}>UNKNOWN / NOT YET VERIFIED</span>
          <h4>What is actually included?</h4>
          <dl>
            {[
              [
                "Femoral component",
                "One research identifier located; not a patient selection.",
              ],
              [
                "Bearing, tibial and optional patellar components",
                "Exact models, materials, fixation and compatibility unconfirmed.",
              ],
              [
                "ROSA, mymobility and Persona IQ",
                "Whether any are included in a proposed procedure is unknown.",
              ],
              [
                "Costs and access",
                "Coverage, out-of-pocket cost and local availability unverified.",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            No configuration has been chosen for you. No medical details or
            uploads are needed.
          </p>
        </div>
      </div>
      <div id="persona-materials" tabIndex={-1} className={styles.block}>
        <h3>Materials belong to components.</h3>
        <p className={styles.intro}>
          Metal alloy, surface treatment and plastic bearing are different
          specifications. The illustration’s colors do not identify any of them.
        </p>
        <div className={styles.scope}>
          <strong>Read material descriptions at component level.</strong>
          <p>
            The consumer page uses broad Tivanium wording; the professional page
            assigns that description to the tibial option. Neither establishes
            the alloy of femoral model 42-5026-066-02. Both assertions and their
            scopes are retained in the research record.
          </p>
        </div>
        <div className={styles.grid}>
          {materials.map((item) => (
            <article key={item.title}>
              <span className={styles.label}>{item.label}</span>
              <h4>{item.title}</h4>
              <p>{item.text}</p>
              <details>
                <summary>Applicability & remaining gap</summary>
                <p>{item.gap}</p>
                <blockquote>
                  What are the exact materials and applicable MRI conditions for
                  every component?
                </blockquote>
                <Source href={item.href}>{item.source}</Source>
              </details>
            </article>
          ))}
        </div>
      </div>
      <div id="persona-technology" tabIndex={-1} className={styles.block}>
        <h3>Three technologies. Different jobs.</h3>
        <p className={styles.intro}>
          Do not assume that a Persona implant includes a robot, an app or an
          implanted sensor. Each needs its own explanation.
        </p>
        <div className={styles.grid}>
          {technologies.map((item) => (
            <article key={item.title}>
              <span className={styles.label}>
                {item.category} · inclusion unknown
              </span>
              <h4>{item.title}</h4>
              <p>{item.summary}</p>
              <details>
                <summary>Claim, evidence & limits</summary>
                <dl>
                  <div>
                    <dt>Manufacturer claim</dt>
                    <dd>{item.claim}</dd>
                  </div>
                  <div>
                    <dt>
                      {item.title === "mymobility"
                        ? "Evidence not yet assessed"
                        : item.title === "ROSA"
                          ? "Clinical finding"
                          : "Regulatory context"}
                    </dt>
                    <dd>{item.evidence}</dd>
                  </div>
                  <div>
                    <dt>Limitations / unknowns</dt>
                    <dd>{item.limitation}</dd>
                  </div>
                </dl>
                <blockquote>{item.question}</blockquote>
                <Source href={item.href}>{item.source}</Source>
              </details>
            </article>
          ))}
        </div>
      </div>
      <section
        id="persona-iq-feature"
        tabIndex={-1}
        aria-labelledby="iq-feature-heading"
        className={styles.smartFeature}
      >
        <div className={styles.smartIntro}>
          <div>
            <p className={styles.eyebrow}>FEATURE SPOTLIGHT / PERSONA IQ</p>
            <h3 id="iq-feature-heading">The chip is in the sensor stem.</h3>
            <p>
              Zimmer Biomet describes Persona IQ as a Persona knee combined with
              a sensor-equipped stem beneath the tibial tray. It is a specific
              smart-implant option, not a chip in every Persona knee or in our
              identified femoral example.
            </p>
            <p className={styles.purpose}>
              <strong>Why it matters:</strong> the manufacturer’s aim is to give
              patients and care teams a view of movement trends between visits.
            </p>
            <Source href={iqPatient}>
              Explore Zimmer Biomet’s Persona IQ patient page
            </Source>
          </div>
          <figure className={styles.sensorFigure}>
            <svg
              viewBox="0 0 320 250"
              role="img"
              aria-labelledby="sensor-title sensor-desc"
            >
              <title id="sensor-title">
                Illustrative location of the sensor stem
              </title>
              <desc id="sensor-desc">
                A schematic tibial tray with a stem beneath it. A highlighted
                area represents the stem’s sensing electronics. This is not a
                manufacturer drawing or a representation of the existing 3D
                model.
              </desc>
              <path
                d="M38 65Q80 35 153 51Q220 34 271 64L269 87Q210 105 155 91Q92 105 41 87Z"
                fill="#9ab4a7"
                stroke="#355a48"
                strokeWidth="2"
              />
              <path d="M131 96H175L170 207Q153 225 136 207Z" fill="#426d58" />
              <rect
                x="141"
                y="126"
                width="24"
                height="49"
                rx="6"
                fill="#dac38d"
              />
              <path
                d="M166 151H221L239 126"
                fill="none"
                stroke="#6a582e"
                strokeWidth="2"
              />
              <text x="211" y="115" fill="#35513f" fontSize="12">
                Sensor stem
              </text>
              <path d="M175 48L192 25H260" fill="none" stroke="#35513f" />
              <text x="205" y="20" fill="#35513f" fontSize="12">
                Tibial tray
              </text>
            </svg>
            <figcaption>
              Illustrative location only · not exact geometry, scale or
              component compatibility.
            </figcaption>
          </figure>
        </div>
        <div
          className={styles.metrics}
          role="group"
          aria-label="Manufacturer-described Persona IQ movement metrics"
        >
          {sensorMetrics.map((metric) => (
            <div key={metric}>
              <span aria-hidden="true">→</span>
              <strong>{metric}</strong>
            </div>
          ))}
        </div>
        <p className={styles.metricNote}>
          Manufacturer-described metrics. Qualified steps refer to the device’s
          sampling criteria; they should not be assumed to equal every step
          counted by a watch. The patient page states that the implant does not
          track GPS location.
        </p>
        <h4>From the implant to a conversation.</h4>
        <ol className={styles.dataFlow}>
          <li>
            <span>01 / IMPLANT</span>
            <strong>Collect movement</strong>
            <p>The sensor stem records activity and motion data.</p>
          </li>
          <li>
            <span>02 / HOME BASE STATION</span>
            <strong>Transfer overnight</strong>
            <p>A home receiver sends the data online.</p>
          </li>
          <li>
            <span>03 / MYMOBILITY</span>
            <strong>Review the trends</strong>
            <p>Patients and care teams can view the information.</p>
          </li>
        </ol>
        <div className={styles.smartTradeoffs}>
          <div>
            <span className={styles.label}>
              PRACTICAL VALUE / MANUFACTURER PURPOSE
            </span>
            <h4>More visibility between appointments.</h4>
            <p>
              Movement trends can give you something concrete to discuss with
              your provider. They complement questions about pain, function and
              recovery goals.
            </p>
            <Source href={iqProfessional}>
              Read the professional system overview
            </Source>
          </div>
          <div>
            <span className={styles.label}>UNDERSTAND THE COMMITMENT</span>
            <h4>A connected implant needs a care workflow.</h4>
            <p>
              Confirm home connectivity, who reviews data, response times, costs
              and long-term support. The patient FAQ describes care-team and
              authorized administrator access; ask how your data are shared.
            </p>
            <Source href={iqPatient}>Read the patient FAQs</Source>
          </div>
        </div>
        <details className={styles.versionNote}>
          <summary>Which stem version and labeling apply?</summary>
          <p>
            <strong>Version matters:</strong> the original Canturio Tibial
            Extension authorization (2021) refers to patients normally indicated
            for at least a 58 mm stem extension. FDA K234056, cleared April 24,
            2024, covers the later Canturio Smart Extension for cemented knee
            replacement normally indicated for at least a 30 mm stem extension.
            The manufacturer’s CSE surgical-technique document matches the
            shorter version. Ask your provider which version is proposed and
            why.
          </p>
          <Source href={iqShort}>
            FDA K234056 · shorter smart extension · April 24, 2024
          </Source>
          <Source href={iqTechnique}>
            Manufacturer CSE surgical technique · revision A
          </Source>
          <p>
            The patient FAQ also asks people to inform providers about the smart
            implant before medical procedures. Discuss applicable MRI
            conditions, procedure restrictions, battery/service life and support
            with the care team using the exact-system instructions.
          </p>
          <Source href={iqProfessional}>
            Compare the manufacturer’s headline and indications
          </Source>
        </details>
        <p className={styles.regulatoryBoundary}>
          <strong>Keep the purpose clear:</strong> the professional page states
          that the movement data are not intended to support clinical
          decision-making and have not demonstrated clinical benefit. Ask your
          provider how this information fits into follow-up visits and
          conversations about symptoms and recovery goals.
        </p>
        <p className={styles.metricNote}>
          See the research record for source dates · manufacturer descriptions
          and stated labeling limitations · no sensor has been selected for this
          research example.
        </p>
      </section>
      <div id="persona-findings" tabIndex={-1} className={styles.block}>
        <h3>Does more choice mean better outcomes?</h3>
        <article className={styles.finding}>
          <span className={styles.label}>
            CLINICAL FINDING / DEFINED COMPARISON
          </span>
          <h4>Two-year results did not show a patient-reported advantage.</h4>
          <p>
            {claimById("persona-outcomes").text}{" "}
            {claimById("persona-outcomes").applicability}
          </p>
          <details>
            <summary>Study scope, funding & limitations</summary>
            <p>
              {personaStudy.design}; {personaStudy.sampleSize} participants.{" "}
              {personaStudy.population}. {personaStudy.followUp}.{" "}
              {personaStudy.funding} {personaStudy.limitations}
            </p>
            <Source href={trial}>Persona versus NexGen clinical study</Source>
          </details>
          <p className={styles.interpretation}>
            <strong>Siona interpretation:</strong>{" "}
            {claimById("persona-interpretation").text}
          </p>
        </article>
        <details className={styles.history}>
          <summary>Historical safety notice: scope matters</summary>
          <p>
            <strong>Verified specification or regulatory fact:</strong>{" "}
            {claimById(historicalNotice.claimId).text}{" "}
            {historicalNotice.affectedScope} {historicalNotice.status}
          </p>
          <p>
            It is not an assessment of our femoral example or every current
            Persona component. Complete recall matching and current labeling
            remain unverified. Termination does not establish that a proposed
            assembly is recall-free.
          </p>
          <Source href={sourceById(historicalNotice.sourceId).url}>
            FDA recall record Z-1266-2015
          </Source>
        </details>
        <div className={styles.next}>
          <span className={styles.label}>NEXT STEP / CARE-TEAM DISCUSSION</span>
          <h4>Ask for the plan behind the product name.</h4>
          <p>
            Bring the exact component list, the evidence gaps and any separate
            technology commitments to the discussion.
          </p>
          <a href="#device-questions">Use the care-team checklist →</a>
          <Source href={consumer}>Manufacturer consumer overview</Source>
        </div>
      </div>
    </section>
  );
}
