import assert from "node:assert/strict";
import { test } from "node:test";
import {
  expiryLabel,
  expiryState,
  matchesRecord,
} from "../src/lib/passport/record-filters";
test("expiry states use inclusive UTC dates and the 90-day boundary", () => {
  const today = "2026-01-01";
  assert.equal(expiryState("2025-12-31", today), "expired");
  assert.equal(expiryState(today, today), "due");
  assert.equal(expiryState("2026-04-01", today), "due");
  assert.equal(expiryState("2026-04-02", today), "current");
  assert.equal(expiryState(null, today), "undated");
  assert.equal(expiryState("2026-02-30", today), "undated");
  assert.equal(expiryLabel(today, today), "Expires today");
  assert.equal(expiryLabel(null, today), "No expiry recorded");
});
test("search matches all words regardless of case and combines with filters", () => {
  const item = {
    id: "example",
    text: "CE · Trauma Nursing · Test Provider",
    expiry: "due" as const,
    linked: true,
  };
  assert.equal(matchesRecord(item, "  NURSING trauma ", "all"), true);
  assert.equal(matchesRecord(item, "trauma", "due"), true);
  assert.equal(matchesRecord(item, "trauma", "expired"), false);
  assert.equal(matchesRecord(item, "cardiac", "all"), false);
  assert.equal(matchesRecord(item, "", "linked"), true);
  assert.equal(matchesRecord(item, "", "unlinked"), false);
  assert.equal(matchesRecord({ ...item, linked: false }, "", "unlinked"), true);
});
