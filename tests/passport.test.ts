import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ceTotal,
  ownsPath,
  schemas,
  validUpload,
} from "../src/lib/passport/validation";
test("ownership rejects another user, traversal and nested paths", () => {
  assert.equal(ownsPath("alice", "alice/certificate.pdf"), true);
  for (const path of [
    "bob/certificate.pdf",
    "alice-other/file.pdf",
    "alice/../bob/file.pdf",
    "alice/folder/file.pdf",
  ])
    assert.equal(ownsPath("alice", path), false);
});
test("upload validation checks size, MIME and magic bytes", () => {
  assert.equal(validUpload(Buffer.from("%PDF-1.7\n"), "application/pdf"), true);
  assert.equal(validUpload(Buffer.from("not a PDF"), "application/pdf"), false);
  assert.equal(validUpload(Buffer.from("%PDF-1.7\n"), "text/html"), false);
  assert.equal(validUpload(new Uint8Array(4194305), "application/pdf"), false);
  assert.equal(validUpload(new Uint8Array(), "image/png"), false);
  assert.equal(
    validUpload(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "image/png"),
    true,
  );
});
test("CE totals use inclusive dates and avoid fractional rounding drift", () => {
  const entries = [
    { hours: "0.10", completed_on: "2026-01-01" },
    { hours: "0.20", completed_on: "2026-02-01" },
    { hours: 5, completed_on: "2025-12-31" },
    { hours: 10, completed_on: "2026-02-02" },
  ];
  assert.equal(ceTotal(entries, "2026-01-01", "2026-02-01"), 0.3);
  assert.equal(ceTotal(entries, "2026-02-01", "2026-01-01"), 0);
});
test("CE rejects invalid dates and out-of-range hours; strips ownership input", () => {
  const entry = {
    title: "Course",
    provider: "Provider",
    hours: "1.25",
    completed_on: "2026-01-01",
    accreditation: "",
    user_id: "another-user",
  };
  assert.equal(
    schemas.ce_entries.safeParse({ ...entry, hours: 0 }).success,
    false,
  );
  assert.equal(
    schemas.ce_entries.safeParse({ ...entry, hours: 1001 }).success,
    false,
  );
  assert.equal(
    schemas.ce_entries.safeParse({ ...entry, completed_on: "2026-02-30" })
      .success,
    false,
  );
  assert.equal("user_id" in schemas.ce_entries.parse(entry), false);
});

test("licenses and certifications reject reversed validity dates", () => {
  const dates = { issued_on: "2026-11-08", expires_on: "2026-11-07" };
  assert.equal(
    schemas.licenses.safeParse({
      ...dates,
      jurisdiction: "AK",
      license_type: "RN",
      license_number: "",
      status: "self_reported",
    }).success,
    false,
  );
  assert.equal(
    schemas.certifications.safeParse({ ...dates, name: "BLS", issuer: "" })
      .success,
    false,
  );
  assert.equal(
    schemas.certifications.safeParse({
      ...dates,
      expires_on: dates.issued_on,
      name: "BLS",
      issuer: "",
    }).success,
    true,
  );
  assert.equal(
    schemas.certifications.safeParse({
      ...dates,
      expires_on: "",
      name: "BLS",
      issuer: "",
    }).success,
    true,
  );
});
