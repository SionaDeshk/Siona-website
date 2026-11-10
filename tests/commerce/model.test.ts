import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseMinor,
  quoteTotal,
  commerceOperationSchema,
} from "../../src/lib/commerce/model";
import { practiceOperationSchema } from "../../src/lib/practice/model";
test("quote amounts use exact minor units and missing charges remain invalid", () => {
  assert.equal(parseMinor("0.29"), 29);
  assert.equal(parseMinor("12.5"), 1250);
  assert.equal(parseMinor("0"), 0);
  assert.equal(quoteTotal(1250, 2, 500, 0), 3000);
  for (const value of ["", "1.005", "-1", "1e3", "1,000", "Infinity"])
    assert.throws(() => parseMinor(value));
  assert.throws(() => quoteTotal(0, 2, 0, 0));
});
test("quote capture rejects invented extra fields, fractional minor units and unsupported currencies", () => {
  const quote = {
    action: "quote",
    rfq_id: "00000000-0000-4000-8000-000000000001",
    supplier_reference: "SOURCE-REF",
    source_url: "https://example.com/quote",
    currency: "USD",
    unit_minor: 1250,
    shipping_minor: 0,
    tax_minor: 0,
    lead_days: 3,
    valid_until: "2099-12-31",
    delivery_terms: "Actual documented delivery terms.",
    practice_summary: "Reviewed terms for this practice.",
    internal_notes: "",
  };
  assert.equal(commerceOperationSchema.safeParse(quote).success, true);
  for (const change of [
    { shipping_minor: null },
    { unit_minor: 0 },
    { tax_minor: 0.5 },
    { currency: "JPY" },
    { approved: true },
    { source_url: "javascript:alert(1)" },
  ])
    assert.equal(
      commerceOperationSchema.safeParse({ ...quote, ...change }).success,
      false,
    );
});
test("practice acceptance requires an explicit confirmation and a versioned quote decision", () => {
  const op = {
    action: "quote_decision",
    quote_id: "00000000-0000-4000-8000-000000000001",
    quote_version: 2,
    request_version: 2,
    decision: "Accept",
    confirmed: true,
    notes: "Accepted the quoted terms for coordination.",
  };
  assert.equal(practiceOperationSchema.safeParse(op).success, true);
  assert.equal(
    practiceOperationSchema.safeParse({ ...op, confirmed: false }).success,
    false,
  );
  assert.equal(
    practiceOperationSchema.safeParse({ ...op, actor_id: "someone-else" })
      .success,
    false,
  );
  assert.equal(
    practiceOperationSchema.safeParse({ ...op, quote_version: 0 }).success,
    false,
  );
});
