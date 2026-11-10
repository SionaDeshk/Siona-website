import { test } from "node:test";
import assert from "node:assert/strict";
import {
  operationSchema,
  readiness,
  today,
} from "../../src/lib/operations/model";
import { demoData, rehearse } from "../../src/lib/operations/demo";

test("eligibility is specific to product revision, state, channel and current evidence", () => {
  const data = demoData(),
    request = data.requests[0];
  assert.deepEqual(readiness(request, data), []);
  assert.match(
    readiness(
      { ...request, channel: "Consumer", practice_id: null },
      data,
    ).join(" "),
    /consumer eligibility/,
  );
  assert.match(
    readiness({ ...request, state: "CA" }, data).join(" "),
    /practice location/,
  );
  data.products[0].revision++;
  assert.match(readiness(request, data).join(" "), /eligibility review/);
  data.products[0].revision--;
  data.eligibility[0].valid_until = "2000-01-01";
  assert.match(readiness(request, data).join(" "), /eligibility review/);
});
test("suspended suppliers, expired practices and regulated products fail closed", () => {
  const data = demoData(),
    request = data.requests[0];
  data.practices[0].valid_until = "2000-01-01";
  data.suppliers[0].stage = "Under Review";
  data.products[0].kind = "Research use only";
  const reasons = readiness(request, data).join(" ");
  assert.match(reasons, /licensed partner/);
  assert.match(reasons, /Supplier/);
  assert.match(reasons, /Practice onboarding/);
});
test("requests reject unsupported fields, invalid states, fractional quantities and missing practice", () => {
  const data = demoData();
  const request = {
    action: "request",
    product_id: data.products[0].id,
    practice_id: data.practices[0].id,
    channel: "Clinician",
    state: "NY",
    quantity: 1,
    needed_on: today(),
    notes: "Business supply coordination only.",
  };
  assert.ok(operationSchema.safeParse(request).success);
  for (const change of [
    { patient_name: "Unwanted data" },
    { state: "ZZ" },
    { quantity: 1.5 },
    { practice_id: null },
    { channel: "Consumer" },
  ])
    assert.equal(
      operationSchema.safeParse({ ...request, ...change }).success,
      false,
    );
});
test("interactive preview changes only the supplied rehearsal copy", () => {
  const original = demoData();
  const next = rehearse(original, {
    action: "transition",
    id: original.requests[0].id,
    version: 1,
    stage: "Ready",
    notes: "Fictional review completed for preview.",
    handoff_reference: "",
    lot_reference: "",
    lot_expires_on: "",
  });
  assert.equal(original.requests[0].stage, "Review");
  assert.equal(next.requests[0].stage, "Ready");
  assert.equal(next.requests[0].version, 2);
});

test("optional practice website accepts an empty value and rejects invalid URLs without throwing", () => {
  const practice = {
    action: "practice",
    legal_name: "Test practice",
    state: "NY",
    business_email: "ops@example.com",
    scope: "Practice supply coordination.",
    website: "",
  };
  assert.equal(operationSchema.safeParse(practice).success, true);
  for (const website of [
    "not-a-url",
    "javascript:alert(1)",
    "http://example.com",
  ]) {
    assert.equal(
      operationSchema.safeParse({ ...practice, website }).success,
      false,
    );
  }
});
