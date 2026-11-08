import assert from "node:assert/strict";
import { test } from "node:test";
import {
  goalProgress,
  goalSchema,
  renewalSchema,
} from "../src/lib/passport/planning";
test("personal goals validate dates and targets without accepting forged ownership", () => {
  const goal = {
    title: "Learning target",
    target_hours: "4",
    starts_on: "2026-01-01",
    ends_on: "2026-12-31",
    user_id: "forged",
  };
  assert.equal("user_id" in goalSchema.parse(goal), false);
  assert.equal(
    goalSchema.safeParse({ ...goal, target_hours: 0 }).success,
    false,
  );
  assert.equal(
    goalSchema.safeParse({ ...goal, target_hours: 10001 }).success,
    false,
  );
  assert.equal(
    goalSchema.safeParse({ ...goal, ends_on: "2025-12-31" }).success,
    false,
  );
});
test("goal progress uses only its inclusive period, preserves overachievement, and caps its percentage", () => {
  const goal = {
    title: "Personal target",
    target_hours: 2,
    starts_on: "2026-01-01",
    ends_on: "2026-01-31",
  };
  const entries = [
    { hours: 1.5, completed_on: "2026-01-01" },
    { hours: 1, completed_on: "2026-01-31" },
    { hours: 10, completed_on: "2026-02-01" },
  ];
  assert.deepEqual(goalProgress(goal, entries, "2026-01-31"), {
    hours: 2.5,
    target: 2,
    remaining: 0,
    percent: 100,
  });
  assert.equal(goalProgress(goal, entries, "2026-01-15").hours, 1.5);
  assert.equal(
    goalProgress({ ...goal, target_hours: 5 }, entries, "2026-01-31").remaining,
    2.5,
  );
});
test("renewal plans require a license/certification and validate fees and dates", () => {
  const task = {
    title: "Review renewal",
    credential: "licenses:44444444-4444-4444-8444-444444444444",
    notes: "Check issuing authority",
    due_on: "",
    estimated_fee: "",
    currency: "usd",
  };
  const parsed = renewalSchema.parse(task);
  assert.equal(
    renewalSchema.safeParse({
      ...task,
      credential: `licenses:${"-".repeat(36)}`,
    }).success,
    false,
  );
  assert.equal(parsed.currency, "USD");
  assert.equal(parsed.estimated_fee, null);
  assert.equal(parsed.due_on, null);
  assert.equal(
    renewalSchema.safeParse({
      ...task,
      credential: task.credential.replace("licenses", "ce_entries"),
    }).success,
    false,
  );
  assert.equal(
    renewalSchema.safeParse({ ...task, estimated_fee: "-1" }).success,
    false,
  );
  assert.equal(
    renewalSchema.safeParse({ ...task, currency: "dollars" }).success,
    false,
  );
  assert.equal(
    renewalSchema.safeParse({ ...task, due_on: "2026-02-30" }).success,
    false,
  );
});
