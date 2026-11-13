import styles from "./persona-guide.module.css";

const professional =
  "https://www.zimmerbiomet.com/en/products-and-solutions/specialties/knee/persona-knee-system.html";
const consumer =
  "https://www.thepersonalizedknee.com/en/personalized-knee-system/overview.html";
const titanium = "https://www.accessdata.fda.gov/cdrh_docs/pdf19/K193223.pdf";
const iq = "https://www.accessdata.fda.gov/cdrh_docs/pdf20/DEN200064.pdf";
const trial = "https://pmc.ncbi.nlm.nih.gov/articles/PMC11862213/";

const choices = [
  {
    title: "Fit & sizing",
    label: "Manufacturer claim",
    summary: "Several sizes and shapes aim to fit different anatomies.",
    detail:
      "Standard and narrow femoral profiles are available. Choosing a catalog configuration does not establish that an implant was custom-manufactured for one person.",
    question: "Which sizes and profiles are proposed, and why?",
    href: professional,
  },
  {
    title: "Fixation",
    label: "Manufacturer-described options",
    summary: "The family includes cemented and cementless options.",
    detail:
      "A family-level option is not permission to use every component either way. Confirm the fixation and current instructions for each proposed model.",
    question: "How will each component be fixed to bone?",
    href: professional,
  },
  {
    title: "Bearing & stability",
    label: "Manufacturer-described options",
    summary:
      "Bearing options include cruciate-retaining and sacrificing strategies.",
    detail:
      "CR means cruciate retaining. A bearing choice addresses the configuration’s stability strategy; it is not a higher-is-better quality score.",
    question: "What ligament strategy and bearing are proposed?",
    href: professional,
  },
];
const materials = [
  {
    source: "FDA K193223 · January 24, 2020",
    title: "Femoral options",
    label: "Regulatory fact · specific variant",
    text: "FDA record K193223 describes Ti-Nidium CR femoral components: titanium alloy with a nitriding surface treatment.",
    gap: "This does not identify the alloy of our example model 42-5026-066-02. Its exact materials remain unverified.",
    href: titanium,
  },
  {
    source: "Manufacturer overview · revision not displayed",
    title: "Tibial option",
    label: "Manufacturer specification · family level",
    text: "The professional overview describes a Tivanium-alloy tibial option.",
    gap: "No tibial model has been selected here. Do not apply this description to every tray or surface.",
    href: professional,
  },
  {
    source: "Manufacturer overview · revision not displayed",
    title: "Bearing options",
    label: "Manufacturer claim · family level",
    text: "Conventional and vitamin-E polyethylene options are described. Vivacit-E is marketed for resistance to oxidation and wear.",
    gap: "A material-performance claim does not establish longer implant survival for a particular person.",
    href: professional,
  },
];
const technologies = [
  {
    title: "ROSA",
    category: "During surgery",
    summary: "Surgical assistance for planning and positioning.",
    label: "Manufacturer claim",
    claim: "The consumer site promotes precision and recovery benefits.",
    evidence:
      "A 77-patient, single-center, unblinded randomized trial compared ROSA-assisted with manual Persona surgery. At a minimum of one year, alignment improved while patient-reported improvements were similar.",
    limitation:
      "Short follow-up and one surgeon limit generalization; long-term survival was not established. Funding/conflict review is incomplete in this guide.",
    question:
      "What benefit do you expect from ROSA in this procedure, and is there an additional charge?",
    href: "https://pmc.ncbi.nlm.nih.gov/articles/PMC13418316/",
    source: "ROSA clinical study · published 2025, journal issue 2026",
  },
  {
    title: "mymobility",
    category: "Before & after surgery",
    summary: "An app for recovery guidance and care-team communication.",
    label: "Manufacturer claim",
    claim: "The site describes exercises, reminders and messaging.",
    evidence:
      "Manufacturer-described functionality, not a clinical-effectiveness assessment. Independent app-outcome evidence has not been assessed in this iteration.",
    limitation:
      "Access depends on the care team and technology requirements. Monitoring, response times, privacy terms and cost remain unresolved.",
    question:
      "Who reviews messages and progress, when do they respond, and what support is available without the app?",
    href: consumer,
    source: "Manufacturer consumer overview · page revision not displayed",
  },
  {
    title: "Persona IQ",
    category: "Implanted sensing",
    summary: "A specific configuration adds movement sensing.",
    label: "Regulatory fact · original authorization",
    claim: "The manufacturer promotes additional recovery insight.",
    evidence:
      "FDA’s 2021 Canary/CHIRP authorization describes movement data as adjunct information. It states those data are not intended to support clinical decision-making and have not demonstrated clinical benefit.",
    limitation:
      "The original indication concerned cemented knee replacement with at least a 58 mm tibial stem extension. Check current exact-system labeling; this is not included in every Persona implant.",
    question:
      "Is a sensor actually proposed, why is it appropriate, and what happens to the data and long-term support?",
    href: iq,
    source: "FDA DEN200064 · August 27, 2021",
  },
];

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
          Sources checked November 12, 2026. This is a research example, not
          your treatment plan. Current exact-model labeling, compatibility and
          local availability still need verification. Undated web pages are not
          controlled instructions for use.
        </p>
      </div>
      <nav className={styles.links} aria-label="Persona guide topics">
        <a href="#persona-configuration">Configuration</a>
        <a href="#persona-materials">Materials</a>
        <a href="#persona-technology">Supporting technology</a>
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
                <p>{item.detail}</p>
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
      <div id="persona-findings" tabIndex={-1} className={styles.block}>
        <h3>Does more choice mean better outcomes?</h3>
        <article className={styles.finding}>
          <span className={styles.label}>
            CLINICAL FINDING / DEFINED COMPARISON
          </span>
          <h4>Two-year results did not show a patient-reported advantage.</h4>
          <p>
            A 314-patient randomized trial compared Persona CR with NexGen CR.
            The adjusted Oxford Knee Score difference was 0.1 points (95%
            confidence interval −1.4 to 1.7). This concerns those configurations
            and outcomes, not every Persona variant or technology.
          </p>
          <details>
            <summary>Study scope, funding & limitations</summary>
            <p>
              Mortensen et al., Acta Orthopaedica, 2025. Multicenter trial in
              Denmark; primary osteoarthritis; two-year follow-up. Primary
              outcome available for 289 patients. Institutions received Zimmer
              Biomet funding. The study was too small and short to settle
              uncommon complications or long-term survival; introduction-era
              surgeon experience was another limitation.
            </p>
            <Source href={trial}>Persona versus NexGen clinical study</Source>
          </details>
          <p className={styles.interpretation}>
            <strong>Siona interpretation:</strong> A fit or precision claim
            needs outcome-specific evidence. These findings do not establish
            that every device performs identically.
          </p>
        </article>
        <details className={styles.history}>
          <summary>Historical safety notice: scope matters</summary>
          <p>
            <strong>Regulatory fact:</strong> FDA recall Z-1266-2015 concerned
            Persona Trabecular Metal tibial plates, sizes C–J, left and right,
            all lots, following complaints of loosening and radiolucent lines.
            Initiated in 2015; terminated March 13, 2018.
          </p>
          <p>
            It is not an assessment of our femoral example or every current
            Persona component. Complete recall matching and current labeling
            remain unverified. Termination does not establish that a proposed
            assembly is recall-free.
          </p>
          <Source href="https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfRes/res.cfm?id=133978">
            FDA recall record Z-1266-2015
          </Source>
        </details>
        <div className={styles.next}>
          <span className={styles.label}>NEXT STEP / CARE-TEAM DISCUSSION</span>
          <h4>Ask for the plan behind the product name.</h4>
          <ol>
            <li>
              List the exact models, identifiers and fixation for every
              component.
            </li>
            <li>
              Explain the bearing strategy, materials, compatibility and MRI
              labeling.
            </li>
            <li>
              Separate the implant from any robot, app or sensor, including
              costs and support.
            </li>
            <li>
              Discuss the evidence relevant to that configuration, the
              uncertainties and alternatives.
            </li>
            <li>
              Explain how model- and lot-specific safety notices are checked.
            </li>
          </ol>
          <Source href={consumer}>Manufacturer consumer overview</Source>
        </div>
      </div>
    </section>
  );
}
