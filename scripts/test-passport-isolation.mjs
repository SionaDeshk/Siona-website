// Run only against a disposable Supabase project with two dedicated test accounts.
// Required env: PASSPORT_TEST_SUPABASE_URL, PASSPORT_TEST_PUBLISHABLE_KEY,
// PASSPORT_TEST_USER_A_EMAIL, PASSPORT_TEST_USER_A_PASSWORD,
// PASSPORT_TEST_USER_B_EMAIL, PASSPORT_TEST_USER_B_PASSWORD.
// Example: node scripts/test-passport-isolation.mjs
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";

const required = [
  "PASSPORT_TEST_SUPABASE_URL",
  "PASSPORT_TEST_PUBLISHABLE_KEY",
  "PASSPORT_TEST_USER_A_EMAIL",
  "PASSPORT_TEST_USER_A_PASSWORD",
  "PASSPORT_TEST_USER_B_EMAIL",
  "PASSPORT_TEST_USER_B_PASSWORD",
];
for (const key of required)
  if (!process.env[key]) throw new Error(`Missing ${key}. No tests executed.`);
assert.notEqual(
  process.env.PASSPORT_TEST_USER_A_EMAIL,
  process.env.PASSPORT_TEST_USER_B_EMAIL,
  "Use distinct accounts",
);
const url = process.env.PASSPORT_TEST_SUPABASE_URL;
const key = process.env.PASSPORT_TEST_PUBLISHABLE_KEY;
let endpoint;
try {
  endpoint = new URL(url);
} catch {
  throw new Error("Invalid disposable project URL; value withheld");
}
assert.ok(
  endpoint.protocol === "https:" &&
    !endpoint.username &&
    !endpoint.password &&
    endpoint.pathname === "/",
  "Use the HTTPS root URL of the confirmed disposable Supabase project",
);
// Reject privileged credentials before making any network requests.
let role;
try {
  role = JSON.parse(
    Buffer.from(key.split(".")[1] || "", "base64url").toString(),
  ).role;
} catch {
  /* Modern publishable keys are not JWTs. */
}
assert.ok(
  key.startsWith("sb_publishable_") || role === "anon",
  "Use a publishable or legacy anon key, never a secret/service-role key",
);
const client = () =>
  createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
const a = client(),
  b = client(),
  anonymous = client();
const suffix = randomUUID();
const owned = [];
let stage = "sign in";
const check = (result) => {
  if (result.error) throw new Error("Operation failed");
  return result.data;
};
let failed = false;
async function login(c, prefix) {
  const data = check(
    await c.auth.signInWithPassword({
      email: process.env[`PASSPORT_TEST_USER_${prefix}_EMAIL`],
      password: process.env[`PASSPORT_TEST_USER_${prefix}_PASSWORD`],
    }),
  );
  assert.ok(data.user?.id);
  return data.user.id;
}
function trackRow(c, userId, table, values) {
  const fixture = { c, userId, table, id: randomUUID() };
  owned.push(fixture); // Track BEFORE writes, even if the response is lost.
  return { fixture, values: { id: fixture.id, user_id: userId, ...values } };
}
async function insert(c, userId, table, values) {
  const row = trackRow(c, userId, table, values);
  check(await c.from(table).insert(row.values).select("id").single());
  return row.fixture.id;
}
async function hidden(c, table, id) {
  assert.equal(check(await c.from(table).select("id").eq("id", id)).length, 0);
  assert.equal(
    check(
      await c
        .from(table)
        .update({ created_at: "2000-01-01T00:00:00Z" })
        .eq("id", id)
        .select("id"),
    ).length,
    0,
  );
  assert.equal(
    check(await c.from(table).delete().eq("id", id).select("id")).length,
    0,
  );
}
async function deniedWrite(c, owner, userId, table, values) {
  const row = trackRow(owner, userId, table, values);
  assert.ok((await c.from(table).insert(row.values)).error);
}
const pdf = new TextEncoder().encode(
  "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n",
);
async function fileHidden(c, path) {
  assert.ok((await c.storage.from("passport-private").download(path)).error);
  assert.ok(
    (await c.storage.from("passport-private").createSignedUrl(path, 60)).error,
  );
  const removed = await c.storage.from("passport-private").remove([path]);
  assert.ok(removed.error || !removed.data?.length);
  assert.ok(
    (
      await c.storage
        .from("passport-private")
        .update(path, pdf, { contentType: "application/pdf" })
    ).error,
  );
}
try {
  const aId = await login(a, "A"),
    bId = await login(b, "B");
  assert.notEqual(aId, bId);
  for (const [owner, other, ownerId, otherId, label] of [
    [a, b, aId, bId, "A"],
    [b, a, bId, aId, "B"],
  ]) {
    const fixtures = [
      [
        "passport_licenses",
        {
          jurisdiction: "AK",
          license_type: "RN",
          license_number: `TEST-${suffix}`,
        },
      ],
      [
        "passport_ce_entries",
        {
          title: `TEST-${suffix}`,
          provider: "Isolation test",
          hours: 1,
          completed_on: "2026-11-07",
        },
      ],
      [
        "passport_certifications",
        { name: `TEST-${suffix}`, issuer: "Isolation test" },
      ],
    ];
    const ids = {};
    for (const [table, values] of fixtures) {
      stage = `${label}: own CRUD and isolation for ${table}`;
      const id = await insert(owner, ownerId, table, values);
      ids[table] = id;
      assert.equal(
        check(await owner.from(table).select("id").eq("id", id)).length,
        1,
      );
      assert.equal(
        check(
          await owner
            .from(table)
            .update({ created_at: new Date().toISOString() })
            .eq("id", id)
            .select("id"),
        ).length,
        1,
      );
      await hidden(other, table, id);
      await hidden(anonymous, table, id);
      await deniedWrite(other, owner, ownerId, table, values);
      await deniedWrite(anonymous, owner, ownerId, table, values);
      console.log(`PASS: ${stage}`);
    }
    stage = `${label}: private file and document metadata`;
    const path = `${ownerId}/isolation-${randomUUID()}.pdf`;
    owned.push({ c: owner, userId: ownerId, path });
    check(
      await owner.storage
        .from("passport-private")
        .upload(path, pdf, { contentType: "application/pdf", upsert: false }),
    );
    const metadata = {
      storage_path: path,
      original_filename: "isolation-test.pdf",
      mime_type: "application/pdf",
      bytes: pdf.length,
    };
    const docId = await insert(owner, ownerId, "passport_documents", {
      ...metadata,
      ce_entry_id: ids.passport_ce_entries,
    });
    assert.equal(
      check(await owner.from("passport_documents").select("id").eq("id", docId))
        .length,
      1,
    );
    assert.equal(
      check(
        await owner
          .from("passport_documents")
          .update({ original_filename: "synthetic-updated.pdf" })
          .eq("id", docId)
          .select("id"),
      ).length,
      1,
    );
    check(await owner.storage.from("passport-private").download(path));
    check(
      await owner.storage.from("passport-private").createSignedUrl(path, 60),
    );
    await hidden(other, "passport_documents", docId);
    await hidden(anonymous, "passport_documents", docId);
    await deniedWrite(other, owner, ownerId, "passport_documents", {
      ...metadata,
      storage_path: `${ownerId}/${randomUUID()}.pdf`,
    });
    await deniedWrite(anonymous, owner, ownerId, "passport_documents", {
      ...metadata,
      storage_path: `${ownerId}/${randomUUID()}.pdf`,
    });
    await fileHidden(other, path);
    await fileHidden(anonymous, path);
    assert.deepEqual(
      new Uint8Array(
        await check(
          await owner.storage.from("passport-private").download(path),
        ).arrayBuffer(),
      ),
      pdf,
    );
    for (const c of [other, anonymous]) {
      const forbiddenPath = `${ownerId}/${randomUUID()}.pdf`;
      owned.push({ c: owner, userId: ownerId, path: forbiddenPath });
      assert.ok(
        (
          await c.storage
            .from("passport-private")
            .upload(forbiddenPath, pdf, {
              contentType: "application/pdf",
              upsert: false,
            })
        ).error,
      );
    }
    console.log(`PASS: ${stage}`);
    stage = `${label}: cross-account credential links`;
    for (const [field, table] of [
      ["license_id", "passport_licenses"],
      ["ce_entry_id", "passport_ce_entries"],
      ["certification_id", "passport_certifications"],
    ]) {
      await deniedWrite(other, other, otherId, "passport_documents", {
        ...metadata,
        storage_path: `${otherId}/${randomUUID()}.pdf`,
        [field]: ids[table],
      });
    }
    console.log(`PASS: ${stage}`);
  }
} catch {
  failed = true;
  // Only controlled stage names are printed, never SDK responses or inputs.
  console.error(`FAIL: ${stage}. Response details and credentials withheld.`);
} finally {
  const cleanup = async (fixture) => {
    const { c, userId, table, id, path } = fixture;
    try {
      if (path) {
        check(await c.storage.from("passport-private").remove([path]));
        const files = check(
          await c.storage
            .from("passport-private")
            .list(userId, { search: path.split("/")[1] }),
        );
        assert.ok(!files.some((file) => file.name === path.split("/")[1]));
      } else {
        check(await c.from(table).delete().eq("id", id).eq("user_id", userId));
        assert.equal(
          check(
            await c.from(table).select("id").eq("id", id).eq("user_id", userId),
          ).length,
          0,
        );
      }
    } catch {
      failed = true;
      console.error(
        `CLEANUP FAILED: ${table || "storage fixture"}. Inspect this run's disposable fixtures.`,
      );
    }
  };
  // Delete linked metadata before credentials and storage; attempt every cleanup.
  for (const fixture of owned.filter((f) => f.table === "passport_documents"))
    await cleanup(fixture);
  for (const fixture of owned.filter((f) => f.table !== "passport_documents"))
    await cleanup(fixture);
  for (const c of [a, b, anonymous]) {
    try {
      check(await c.auth.signOut({ scope: "local" }));
    } catch {
      failed = true;
      console.error("CLEANUP FAILED: test client sign-out.");
    }
  }
}
if (failed) process.exitCode = 1;
else
  console.log(
    "PASS: bidirectional isolation, anonymous denial, owner CRUD, and fixture cleanup completed",
  );
