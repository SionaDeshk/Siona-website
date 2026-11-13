"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./device-explainer.module.css";

const sources = {
  anatomy: "https://orthoinfo.aaos.org/en/treatment/total-knee-replacement/",
  manufacturer:
    "https://www.zimmerbiomet.com/en/products-and-solutions/specialties/knee/persona-knee-system.html",
  identity: "https://accessgudid.nlm.nih.gov/devices/00889024230408",
  clearance:
    "https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K113369",
  reports: "https://open.fda.gov/data/maude/",
};
const parts = [
  {
    name: "Femoral component",
    plain: "The part on the thighbone",
    number: "01",
    description:
      "A shaped metal surface covers the prepared end of the thighbone. It moves against the bearing below.",
    detail:
      "Our researched example is a Persona femoral component. Its identifier covers this part only; it does not identify a whole replacement knee.",
    status: "One exact component identified",
    question:
      "What is the exact model of the femoral component you are proposing?",
  },
  {
    name: "Bearing insert",
    plain: "The surface between the two",
    number: "02",
    description:
      "A plastic bearing sits between the metal surfaces and provides a surface for movement. Its design is part of the selected configuration.",
    detail:
      "No exact bearing model has been selected or verified for this example. The Persona family includes different bearing options; a family name alone does not establish compatibility.",
    status: "Exact model not established",
    question:
      "Which insert is proposed, and where is its compatibility with the other components documented?",
  },
  {
    name: "Tibial baseplate",
    plain: "The part on the shinbone",
    number: "03",
    description:
      "A baseplate covers the prepared top of the shinbone and supports the bearing. Its fixation and design depend on the selected implant.",
    detail:
      "No exact baseplate model or fixation method has been established here. The drawing is a schematic, not a verified compatible Persona assembly.",
    status: "Exact model not established",
    question:
      "What baseplate and fixation method are proposed, and why are they suitable for my situation?",
  },
] as const;

function Source({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children} <span aria-hidden="true">→</span>
      <span className={styles.srOnly}> (opens a new tab)</span>
    </a>
  );
}

function KneeDiagram({ selected }: { selected: number }) {
  return (
    <svg
      viewBox="0 0 480 540"
      role="img"
      aria-labelledby="knee-diagram-title knee-diagram-desc"
      className={styles.diagram}
    >
      <title id="knee-diagram-title">
        Three main parts of a knee replacement
      </title>
      <desc id="knee-diagram-desc">
        Simplified exploded view: femoral component above a bearing insert, with
        a tibial baseplate below. Shapes are illustrative, not an exact product
        or a compatible assembly.
      </desc>
      <defs>
        <linearGradient id="metal" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#d7ded8" />
          <stop offset=".34" stopColor="#f7f7f0" />
          <stop offset=".62" stopColor="#8eaaa4" />
          <stop offset="1" stopColor="#45675e" />
        </linearGradient>
        <linearGradient id="bearing" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fffdf5" />
          <stop offset="1" stopColor="#d5d0be" />
        </linearGradient>
      </defs>
      <path d="M240 30V505" stroke="#b8c5bb" strokeDasharray="3 9" />
      <ellipse
        cx="240"
        cy="490"
        rx="126"
        ry="15"
        fill="#244b3d"
        opacity=".06"
      />
      <g
        className={
          selected === 0 ? styles.diagramSelected : styles.diagramMuted
        }
      >
        <path
          d="M148 75Q184 37 218 94Q240 124 262 94Q296 37 332 75L355 177Q344 233 295 211L254 175Q240 163 226 175L185 211Q136 233 125 177Z"
          fill="url(#metal)"
          stroke="#45675e"
          strokeWidth="2"
        />
        <path
          d="M157 90Q180 70 201 110L217 170M323 90Q300 70 279 110L263 170"
          fill="none"
          stroke="#fffdf4"
          strokeWidth="5"
          opacity=".65"
        />
        <path d="M351 135H399" stroke="#5a766a" />
        <circle
          cx="414"
          cy="135"
          r="18"
          fill={selected === 0 ? "#244b3d" : "#718578"}
        />
        <text x="414" y="140" textAnchor="middle" fill="white" fontSize="13">
          01
        </text>
      </g>
      <g
        className={
          selected === 1 ? styles.diagramSelected : styles.diagramMuted
        }
      >
        <path
          d="M126 279Q160 241 211 266Q240 282 269 266Q320 241 354 279L350 308Q297 336 240 316Q183 336 130 308Z"
          fill="url(#bearing)"
          stroke="#7c8878"
          strokeWidth="2"
        />
        <path
          d="M139 280Q178 264 216 284Q240 296 264 284Q302 264 341 280"
          fill="none"
          stroke="#bdbba7"
          strokeWidth="2"
        />
        <path d="M355 290H399" stroke="#5a766a" />
        <circle
          cx="414"
          cy="290"
          r="18"
          fill={selected === 1 ? "#244b3d" : "#718578"}
        />
        <text x="414" y="295" textAnchor="middle" fill="white" fontSize="13">
          02
        </text>
      </g>
      <g
        className={
          selected === 2 ? styles.diagramSelected : styles.diagramMuted
        }
      >
        <path
          d="M132 367Q180 340 225 356Q240 362 255 356Q300 340 348 367L345 389Q295 411 240 393Q185 411 135 389Z"
          fill="url(#metal)"
          stroke="#45675e"
          strokeWidth="2"
        />
        <path
          d="M225 398L228 467Q240 486 252 467L255 398"
          fill="url(#metal)"
          stroke="#45675e"
          strokeWidth="2"
        />
        <path d="M350 375H399" stroke="#5a766a" />
        <circle
          cx="414"
          cy="375"
          r="18"
          fill={selected === 2 ? "#244b3d" : "#718578"}
        />
        <text x="414" y="380" textAnchor="middle" fill="white" fontSize="13">
          03
        </text>
      </g>
    </svg>
  );
}

export function DeviceExplainer({
  hostedPreview = false,
}: {
  hostedPreview?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const [answer, setAnswer] = useState("");
  const part = parts[selected];
  return (
    <main id="main" className={styles.root}>
      <header className={styles.header}>
        <Link href="/" className={styles.wordmark}>
          SIONA<span>DEVICE NOTES</span>
        </Link>
        <span className={styles.preview}>
          {hostedPreview
            ? "PROTECTED PREVIEW · NOT PRODUCTION"
            : "DEVELOPMENT PREVIEW · NOT PUBLISHED"}
        </span>
        <Link
          href={
            hostedPreview
              ? "/workspace/intelligence"
              : "/workspace/intelligence/preview"
          }
        >
          Back to Evo <span aria-hidden="true">→</span>
        </Link>
      </header>
      <div className={styles.page}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>A CLOSER LOOK / KNEE REPLACEMENT</p>
          <h1>
            Understand the parts.
            <br />
            <em>Know what to ask.</em>
          </h1>
          <p className={styles.intro}>
            An implant name is a starting point. Understanding the individual
            parts—and their exact identifiers—helps you ask more useful
            questions.
          </p>
          <div className={styles.context}>
            <span>Our first example</span>
            <strong>Persona knee system</strong>
            <p>
              A Zimmer Biomet product family. One femoral component researched;
              the other component models remain unspecified. This example is not
              a recommendation.
            </p>
            <Source href={sources.manufacturer}>
              Manufacturer’s system overview
            </Source>
          </div>
        </section>

        <section className={styles.explore} aria-labelledby="parts-heading">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>01 / UNDERSTAND</p>
            <h2 id="parts-heading">One knee. Several parts.</h2>
            <p>Choose a part to see its role and the question it raises.</p>
          </div>
          <div className={styles.exploreGrid}>
            <figure className={styles.figure}>
              <KneeDiagram selected={selected} />
              <figcaption>
                Illustrative exploded view, not an exact device drawing or
                verified assembly. Some replacements also include a patellar
                component for the kneecap.
              </figcaption>
            </figure>
            <div className={styles.controls}>
              <div
                className={styles.partButtons}
                role="group"
                aria-label="Explore knee components"
              >
                {parts.map((p, index) => (
                  <button
                    key={p.number}
                    aria-pressed={index === selected}
                    onClick={() => setSelected(index)}
                    aria-controls="component-detail"
                  >
                    <span>{p.number}</span>
                    <span>
                      <strong>{p.name}</strong>
                      <small>{p.plain}</small>
                    </span>
                    <span aria-hidden="true">
                      {index === selected ? "−" : "+"}
                    </span>
                  </button>
                ))}
              </div>
              <div
                id="component-detail"
                className={styles.partDetail}
                role="region"
                aria-label="Selected component"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className={styles.status}>{part.status}</span>
                <h3>{part.name}</h3>
                <p>{part.description}</p>
                <p className={styles.muted}>{part.detail}</p>
                <blockquote>
                  <span>A QUESTION TO ASK</span>
                  {part.question}
                </blockquote>
              </div>
              <div className={styles.sourceLine}>
                <Source href={sources.anatomy}>How the parts work: AAOS</Source>
                <Source href={sources.manufacturer}>
                  Persona family options
                </Source>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.identify} aria-labelledby="identity-heading">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>02 / IDENTIFY</p>
            <h2 id="identity-heading">The name isn’t the whole identity.</h2>
            <p>
              “Persona” names a family. A model number and device identifier
              narrow the question to a specific component.
            </p>
          </div>
          <div className={styles.identityGrid}>
            <div className={styles.identityCard}>
              <p className={styles.eyebrow}>
                RESEARCH EXAMPLE / NOT A PRODUCT LABEL
              </p>
              <h3>Femoral component</h3>
              <dl>
                <div>
                  <dt>Labeler / company</dt>
                  <dd>Zimmer, Inc.</dd>
                </div>
                <div>
                  <dt>Model / catalog number</dt>
                  <dd className={styles.identifier}>42-5026-066-02</dd>
                </div>
                <div>
                  <dt>Primary device identifier (DI)</dt>
                  <dd className={styles.identifier}>00889024230408</dd>
                </div>
                <div>
                  <dt>Listed size</dt>
                  <dd>9</dd>
                </div>
              </dl>
              <Source href={sources.identity}>
                Check the original AccessGUDID record
              </Source>
              <p className={styles.tiny}>
                Research snapshot: November 10, 2026. Record version date: March
                17, 2022. A record date is not a clinical review date.
              </p>
            </div>
            <div className={styles.identityNotes}>
              <h3>Ask for the exact identifiers.</h3>
              <p>
                A care team can help identify every component proposed and the
                official labeling that applies. This single record does not
                establish the other parts, their compatibility or suitability
                for a person.
              </p>
              <details>
                <summary>What do these numbers tell me?</summary>
                <dl>
                  <div>
                    <dt>Model / catalog number</dt>
                    <dd>
                      The manufacturer’s reference for this component version.
                    </dd>
                  </div>
                  <div>
                    <dt>Device identifier</dt>
                    <dd>
                      A reference to a device version/model in a
                      device-identification record. It does not identify a
                      patient.
                    </dd>
                  </div>
                  <div>
                    <dt>Lot / batch number</dt>
                    <dd>
                      A separate production identifier. Checking an affected lot
                      may be necessary when reviewing a recall notice. No actual
                      patient or lot record is used here.
                    </dd>
                  </div>
                </dl>
              </details>
              <p className={styles.note}>
                No uploads or personal medical details are needed to explore
                this page.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.evidence} aria-labelledby="evidence-heading">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>03 / ASK BETTER QUESTIONS</p>
            <h2 id="evidence-heading">Good information shows its limits.</h2>
            <p>
              Finding an official record is useful. Understanding its scope
              matters just as much.
            </p>
          </div>
          <div className={styles.evidenceGrid}>
            <article>
              <span className={styles.status}>IDENTITY LOCATED</span>
              <h3>We can identify this component.</h3>
              <p>
                The public record supplies this example’s company, model, DI and
                size.
              </p>
              <Source href={sources.identity}>Device record</Source>
            </article>
            <article>
              <span className={styles.status}>REGULATORY CONTEXT</span>
              <h3>Clearance is not a quality ranking.</h3>
              <p>
                The linked FDA record is a 510(k) substantial-equivalence
                decision. It does not establish that this device performs better
                than another.
              </p>
              <Source href={sources.clearance}>
                Linked FDA clearance record
              </Source>
            </article>
            <article className={styles.gap}>
              <span className={styles.status}>NOT YET VERIFIED</span>
              <h3>Important questions remain open.</h3>
              <p>
                Exact materials, current U.S. instructions, MRI conditions,
                compatible component models, complete recall matching and
                applicable clinical outcomes.
              </p>
              <p>
                Missing information is a gap—not evidence that a device is safe
                or unsafe.
              </p>
            </article>
          </div>
          <div className={styles.recallNote}>
            <h3>A shared brand is not an exact match.</h3>
            <p>
              A recall needs matching to its specific device and scope. This
              prototype has not completed that assessment. Adverse-event report
              counts alone cannot establish failure rates or compare device
              safety.
            </p>
            <Source href={sources.reports}>
              FDA explanation of report limitations
            </Source>
          </div>
        </section>

        <section className={styles.check} aria-labelledby="check-heading">
          <div>
            <p className={styles.eyebrow}>A QUICK CHECK</p>
            <h2 id="check-heading">What can this page tell you?</h2>
            <p>Choose the statement that best matches the evidence shown.</p>
          </div>
          <fieldset>
            <legend className={styles.srOnly}>Check your understanding</legend>
            {[
              ["best", "Which implant is best for me."],
              [
                "identity",
                "How to identify one component and the questions still to resolve.",
              ],
              ["safe", "That this whole knee system is recall-free."],
            ].map(([value, label]) => (
              <label key={value}>
                <input
                  type="radio"
                  name="understanding"
                  value={value}
                  checked={answer === value}
                  onChange={() => setAnswer(value)}
                />
                <span>{label}</span>
              </label>
            ))}
            <div className={styles.answer} role="status" aria-live="polite">
              {answer &&
                (answer === "identity"
                  ? "Exactly. Identity is a starting point; the configuration and unresolved evidence still matter."
                  : "Take another look: this page identifies one component. It does not recommend an implant or establish complete recall coverage.")}
            </div>
          </fieldset>
          <p className={styles.tiny}>
            This check stays in this browser tab and resets when you reload.
            Nothing is submitted or saved.
          </p>
        </section>
        <footer className={styles.footer}>
          <strong>
            SIONA <em>The path is the way.</em>
          </strong>
          <p>
            Private product-research prototype · Source gaps remain visible · No
            suitability assessment or comparative rating.
          </p>
          <Link
            href={
              hostedPreview
                ? "/workspace/intelligence"
                : "/workspace/intelligence/preview"
            }
          >
            Return to the Evo workspace →
          </Link>
        </footer>
      </div>
    </main>
  );
}
