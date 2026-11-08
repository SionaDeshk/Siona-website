import assert from "node:assert/strict";
import { test } from "node:test";
import {
  credentialFields,
  formValues,
  validationErrors,
} from "../src/lib/passport/form-state";
import { schemas } from "../src/lib/passport/validation";
import {
  type PassportRow,
  credentialOptions,
  documentCredentialKey,
  groupLinkedDocuments,
} from "../src/lib/passport/credential-links";
test("retry state contains only allowlisted non-secret form fields", () => {
  const form = new FormData();
  form.set("title", "My unfinished course");
  form.set("hours", "3.25");
  for (const name of ["password", "access_token", "user_id", "storage_path"])
    form.set(name, "must not be reflected");
  form.set("file", new Blob(["synthetic"]), "file.pdf");
  const values = formValues(form, credentialFields.ce_entries);
  assert.equal(values.title, "My unfinished course");
  assert.equal(values.hours, "3.25");
  for (const name of [
    "password",
    "access_token",
    "user_id",
    "storage_path",
    "file",
  ])
    assert.equal(name in values, false);
});
test("date-order errors attach to the expiry field", () => {
  const result = schemas.certifications.safeParse({
    name: "BLS",
    issuer: "Test",
    issued_on: "2026-02-02",
    expires_on: "2026-01-01",
  });
  assert.equal(result.success, false);
  if (!result.success)
    assert.equal(
      validationErrors(result.error).expires_on,
      "Expiry must be on or after issue date",
    );
});
test("document links use credential kind plus id and ignore unlinked documents", () => {
  const rows = [
    [
      {
        id: "l",
        jurisdiction: "AK",
        license_type: "RN",
        license_number: "TEST-123",
      },
    ],
    [{ id: "c", title: "Course", completed_on: "2026-01-01" }],
    [{ id: "b", name: "BLS", issuer: "Test" }],
  ];
  const options = credentialOptions(rows);
  assert.equal(options[0].value, "licenses:l");
  assert.equal(options[0].label, "License · AK RN · TEST-123");
  assert.equal(options[1].href, "#credential-c");
  assert.equal(options[2].label, "Certification · BLS · Test");
  const documents: PassportRow[] = [
    { id: "d1", ce_entry_id: "c" },
    { id: "d2", license_id: "l" },
    { id: "d3", certification_id: "b" },
    { id: "d4", ce_entry_id: null },
  ];
  const grouped = groupLinkedDocuments(documents);
  assert.equal(grouped.size, 3);
  assert.equal(grouped.get("ce_entries:c")?.[0].id, "d1");
  assert.equal(documentCredentialKey(documents[3]), null);
  assert.equal(documentCredentialKey(documents[2]), "certifications:b");
});
