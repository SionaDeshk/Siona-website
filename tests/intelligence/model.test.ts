import { test } from "node:test";
import assert from "node:assert/strict";
import {
  criteria,
  scoreOpportunity,
  signalSchema,
  operationSchema,
} from "../../src/lib/intelligence/model";
import {
  parseRss,
  ingestApprovedFeed,
} from "../../src/lib/intelligence/ingestion";
const weights = criteria.map(([criterion]) => ({ criterion, weight: 10 }));
test("missing evidence produces neither a favorable score nor confidence", () => {
  assert.deepEqual(scoreOpportunity([], weights), {
    score: 0,
    confidence: 0,
    coverage: 0,
  });
  const one = scoreOpportunity(
    [{ criterion: "fit", score: 5, rationale: "A documented reason for fit." }],
    weights,
  );
  assert.equal(one.score, 11);
  assert.equal(one.coverage, 11);
  assert.equal(one.confidence, 3);
  const all = scoreOpportunity(
    criteria.map(([criterion]) => ({
      criterion,
      score: 5,
      rationale: "Source-backed assessment with explicit reasoning.",
    })),
    weights,
  );
  assert.deepEqual(all, { score: 100, coverage: 100, confidence: 100 });
  assert.equal(
    scoreOpportunity([{ criterion: "fit", score: 5, rationale: "" }], weights)
      .score,
    0,
  );
});
test("validates genuine URLs, classification, and complete evaluation criteria", () => {
  assert.equal(
    signalSchema.safeParse({
      title: "A title",
      source_url: "javascript:alert(1)",
    }).success,
    false,
  );
  const scores = criteria.map(([criterion]) => ({
    criterion,
    score: null,
    rationale: "No evidence has been collected.",
  }));
  assert.equal(
    operationSchema.safeParse({
      operation: "evaluation",
      data: { opportunity_id: "00000000-0000-4000-8000-000000000001", scores },
    }).success,
    true,
  );
  scores[1].criterion = scores[0].criterion;
  assert.equal(
    operationSchema.safeParse({
      operation: "evaluation",
      data: { opportunity_id: "00000000-0000-4000-8000-000000000001", scores },
    }).success,
    false,
  );
  assert.equal(
    operationSchema.safeParse({
      operation: "link",
      opportunity_id: "00000000-0000-4000-8000-000000000001",
      rationale: "Nothing to link.",
    }).success,
    false,
  );
});
test("RSS parsing rejects entities and malformed entries without inventing publication dates", () => {
  assert.throws(() =>
    parseRss('<!DOCTYPE x [<!ENTITY a SYSTEM "file:///etc/passwd">]>'),
  );
  const xml =
    "<rss><channel><title>Test publisher</title><item><title>Test signal</title><link>https://example.com/test</link><pubDate>Tue, 03 Nov 2026 12:00:00 GMT</pubDate><description>Original summary</description></item><item><title>No date</title><link>https://example.com/no-date</link></item></channel></rss>";
  const result = parseRss(xml);
  assert.equal(result.length, 1);
  assert.equal(result[0].published_on, "2026-11-03");
});
test("ingestion cannot fetch arbitrary user-provided URLs", async () => {
  await assert.rejects(
    ingestApprovedFeed("manual", "http://169.254.169.254/latest/meta-data"),
  );
  await assert.rejects(
    ingestApprovedFeed("federal-register", "https://attacker.example"),
  );
});

test("optional AI stays optional and rejects invented evidence IDs and source URLs", async () => {
  const { analyzeEvidence } =
    await import("../../src/lib/intelligence/analysis");
  assert.equal((await analyzeEvidence([])).status, "not_configured");
  const evidence = [
    {
      id: "00000000-0000-4000-8000-000000000001",
      title: "Test",
      summary: "Test source material",
      source_url: "https://example.com/test",
      evidence_type: "third_party_claim",
    },
  ];
  const draft = {
    summary: "A hypothesis, not a finding.",
    hypotheses: [],
    competing_explanations: [],
    missing_evidence: [],
    supplier_questions: [],
    validation_experiments: [],
    citation_ids: [evidence[0].id],
  };
  assert.equal(
    (await analyzeEvidence(evidence, { analyze: async () => draft })).status,
    "draft",
  );
  await assert.rejects(
    analyzeEvidence(evidence, {
      analyze: async () => ({
        ...draft,
        citation_ids: ["00000000-0000-4000-8000-000000000002"],
      }),
    }),
  );
  await assert.rejects(
    analyzeEvidence(evidence, {
      analyze: async () => ({
        ...draft,
        summary: "Source https://invented.example/report",
      }),
    }),
  );
});
test("body limits apply to streamed requests without trusting content-length", async () => {
  const { readLimitedBody } = await import("../../src/lib/intelligence/body");
  const request = new Request("https://example.com", {
    method: "POST",
    body: "x".repeat(20),
  });
  await assert.rejects(readLimitedBody(request, 10), /BODY_TOO_LARGE/);
  const ok = await readLimitedBody(
    new Request("https://example.com", { method: "POST", body: "abc" }),
    10,
  );
  assert.equal(new TextDecoder().decode(ok), "abc");
});
