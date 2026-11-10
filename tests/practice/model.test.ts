import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canCancel,
  practiceOperationSchema,
} from "../../src/lib/practice/model";
import { practiceDemo, rehearsePractice } from "../../src/lib/practice/demo";

test("practice requests accept only coordination fields and a valid idempotency key", () => {
  const data = practiceDemo()[0];
  const request = {
    action: "submit",
    practice_id: data.practice_id,
    offer_id: data.offers[0].id,
    submission_key: "00000000-0000-4000-8000-000000000001",
    quantity: 3,
    needed_on: data.offers[0].valid_until,
    reference: "BUSINESS-REF",
    message: "Business requirements only.",
  };
  assert.ok(practiceOperationSchema.safeParse(request).success);
  for (const change of [
    { patient_name: "Unsupported" },
    { stage: "Ready" },
    { practice_id: "invalid" },
    { submission_key: "invalid" },
    { quantity: 0 },
    { quantity: 1.5 },
  ])
    assert.equal(
      practiceOperationSchema.safeParse({ ...request, ...change }).success,
      false,
    );
});
test("practice cancellation respects role and the coordination stage", () => {
  const request = practiceDemo()[0].requests[0];
  assert.equal(canCancel(request, "requester"), false);
  assert.equal(
    canCancel({ ...request, stage: "Review", cancellable: true }, "requester"),
    true,
  );
  assert.equal(
    canCancel({ ...request, stage: "Review", cancellable: false }, "requester"),
    false,
  );
  assert.equal(canCancel({ ...request, stage: "Review" }, "viewer"), false);
  assert.equal(
    canCancel({ ...request, stage: "Completed" }, "requester"),
    false,
  );
});
test("the rehearsal keeps location snapshots separate and enforces its view-only role", () => {
  const [first, second] = practiceDemo();
  const result = rehearsePractice(first, {
    action: "submit",
    practice_id: first.practice_id,
    offer_id: first.offers[0].id,
    submission_key: "00000000-0000-4000-8000-000000000001",
    quantity: 2,
    needed_on: first.offers[0].valid_until,
    reference: "",
    message: "",
  });
  assert.equal(result.data.requests.length, first.requests.length + 1);
  assert.equal(second.requests.length, 1);
  assert.throws(
    () =>
      rehearsePractice(second, {
        action: "cancel",
        request_id: second.requests[0].id,
        version: 3,
        reason: "A viewer cannot cancel this request.",
      }),
    /view-only/,
  );
});
