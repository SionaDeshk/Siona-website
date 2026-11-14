import type { Row } from "./model";

/** Planning content, never evidence of demand or authorization. No database writes. */
export const planningCases = [
  {
    id: "a0000000-0000-4000-8000-000000000001",
    key: "device-information",
    name: "Device information",
    title: "UNVALIDATED · Device-information service",
    problem:
      "Can people and professionals reliably identify an exact implant model and understand its labeling, materials, regulatory records and evidence limitations? The frequency and cost of this problem remain unvalidated.",
    affected:
      "Prospective users: people researching implants and professionals who support device-information or monitoring workflows. No customer demand has been established.",
    proposition:
      "Test a source-linked information service for one implant category, showing manufacturer, model, identifiers, labeling, recalls and visible evidence gaps. Do not infer clinical superiority from clearance, catalog attributes or raw adverse-event counts.",
    customers:
      "Users and payers may differ. Test patient usefulness separately from professional willingness to pay for monitoring or data services.",
    partners:
      "Public regulatory data may support an initial prototype. Data rights, maintenance effort and any later commercial partnerships remain unknown.",
    revenue:
      "Unknown. A free public information layer and paid professional monitoring are hypotheses. Test price, recurring demand, research/update costs, support costs and acquisition cost before estimating margin.",
    barriers:
      "Regulatory scope: define the boundary between sourced information and clinical advice; review claims, privacy and data-use terms. Evidence risk: device identification is not comparative clinical quality. Commercial risk: existing resources may already meet the need; a payer has not been validated.",
    assumptions:
      "Exact-model information is difficult to assemble; users value traceable sources and limitations; a professional buyer will pay enough to cover reliable updates. Each assumption needs independent evidence.",
    invalidation:
      "Hold or reject if users can already answer these questions with existing tools, source coverage is unreliable, or professional buyers will not pay enough to cover delivery costs.",
    experiment: "Test one implant-category information prototype",
    experiment_details:
      "Before recruiting, choose one category, interview target users and professional buyers separately, and define a sample and decision threshold. Test whether they can identify the exact model, find source evidence and recognize evidence gaps. Record existing alternatives and price objections.",
    success_criteria:
      "Predefine a sample, a task-completion threshold and a willingness-to-pay test. Continue only if a repeated unmet need and a credible payer emerge; record contradicting findings and use Inconclusive when evidence is insufficient.",
    source_url:
      "https://www.federalregister.gov/documents/2023/02/14/2023-03071/agency-information-collection-activities-submission-for-office-of-management-and-budget-review",
    source_title: "Public device identification data: scope and limitations",
    source_summary:
      "The FDA GUDID description supports investigating public device-identification data. It does not establish comparative clinical quality, demand for Siona's service or willingness to pay. Recheck the original source before recording a reviewed finding.",
    published_on: "2023-02-14",
  },
  {
    id: "a0000000-0000-4000-8000-000000000002",
    key: "supplier-direct-biologics",
    name: "Supplier-direct Biologics",
    title: "UNVALIDATED · Supplier-direct Biologics",
    problem:
      "Do qualified research buyers have an unmet procurement need that Siona can serve through an authorized supplier-direct arrangement? No actual demand, supplier agreement or viable unit economics have been established.",
    affected:
      "Prospective B2B laboratories and research organizations for one exact eligible product and intended use. Customer category and geography must be defined before evaluating a route.",
    proposition:
      "Evaluate one lawful, documented research-supply route with supplier-direct fulfillment only when explicitly authorized. Existing supply software is infrastructure, not evidence of a viable business.",
    customers:
      "Qualified research buyers; test purchasing authority, present vendor, unmet need, switching cost and willingness to place an eligible order. No consumer or clinical-use route is assumed.",
    partners:
      "Sinopep is a prospective supplier only. No relationship, reseller authorization, response or fulfillment arrangement is established. Verify an official contact channel and the exact contracting entity.",
    revenue:
      "Unknown. Model selling price minus actual supplier cost, shipping/cold chain, transaction fees, duties, support, returns and expected losses. Test order volume, acquisition cost and working capital separately. Public catalog prices are not wholesale quotes.",
    barriers:
      "Regulatory blocker: exact product classification, intended use, buyer eligibility and jurisdiction remain unresolved. Authorization blocker: written resale/fulfillment terms are missing. Quality and operating risks: traceability, documentation, returns, recalls and liability. A research-use-only label does not authorize human-use marketing.",
    assumptions:
      "A supplier will authorize the exact customer/product route; buyers have a material unmet need; documentation and fulfillment are reliable; contribution margin remains positive under downside costs.",
    invalidation:
      "Hold or reject if the exact route is ineligible, the supplier will not authorize it, buyers prefer existing alternatives, or defensible downside economics cannot support the work.",
    experiment: "Validate one exact supplier-direct product route",
    experiment_details:
      "Define product, intended use, buyer category and geography. Through an authorized process, verify the supplier's official channel, request written terms and qualification evidence, and interview prospective buyers. No messages, orders or commitments are sent by this planning case.",
    success_criteria:
      "Before a commercial pilot, require written route authorization, product-specific regulatory and quality review, evidence of a buyer problem and a source-backed cost scenario. No reply is missing evidence. Stop if eligibility or authorization fails; no aggregate score overrides these blockers.",
    source_url:
      "https://www.federalregister.gov/documents/2026/05/01/2026-08552/list-of-bulk-drug-substances-for-which-there-is-a-clinical-need-under-section-503b-of-the-federal",
    source_title: "Product-specific regulatory scope must be established",
    source_summary:
      "Saved project research describes a May 2026 FDA proposed position on certain bulk substances. It does not establish the eligibility of any unspecified peptide or research-supply route. Verify the source and applicable product-specific rules; supplier authorization is separately unknown.",
    published_on: "2026-05-01",
  },
] as const;

export function planningCaseRow(item: (typeof planningCases)[number]): Row {
  return {
    ...Object.fromEntries(
      [
        "title",
        "problem",
        "affected",
        "proposition",
        "customers",
        "partners",
        "revenue",
        "barriers",
        "assumptions",
        "invalidation",
      ].map((key) => [key, item[key as keyof typeof item]]),
    ),
    id: item.id,
    planning_case: true,
    stage: "Discovered",
  };
}
