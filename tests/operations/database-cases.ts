import { test } from "node:test";
import assert from "node:assert/strict";
import type { Pool, PoolClient } from "pg";
type Harness = {
  pool: () => Pool;
  asUser: <T>(id: string, run: (db: PoolClient) => Promise<T>) => Promise<T>;
  admin: string;
  analyst: string;
  viewer: string;
  outsider: string;
};

/** Runs only inside the existing disposable database harness, never a hosted project. */
export function operationsDatabaseTests({
  pool,
  asUser,
  admin,
  analyst,
  viewer,
  outsider,
}: Harness) {
  let practice: string, product: string, supplier: string, request: string;
  const future = new Date(Date.now() + 90 * 86400000)
    .toISOString()
    .slice(0, 10);
  const run = (
    actor: string,
    action: string,
    payload: Record<string, unknown>,
  ) =>
    asUser(
      actor,
      async (db) =>
        (
          await db.query("select ops_save($1,$2::jsonb) id", [
            action,
            JSON.stringify(payload),
          ])
        ).rows[0].id as string,
    );
  const transition = (id: string, version: number, stage: string, extra = {}) =>
    run(analyst, "transition", {
      id,
      version,
      stage,
      notes: "Documented business coordination outcome.",
      handoff_reference: "",
      lot_reference: "",
      lot_expires_on: "",
      ...extra,
    });
  const newRequest = (extra = {}) =>
    run(analyst, "request", {
      practice_id: practice,
      product_id: product,
      channel: "Clinician",
      state: "NY",
      quantity: 2,
      needed_on: future,
      notes: "Test-only practice supply coordination.",
      ...extra,
    });
  const review = (extra = {}) =>
    run(admin, "eligibility", {
      product_id: product,
      product_revision: 1,
      state: "NY",
      channel: "Clinician",
      status: "Approved",
      evidence_url: "https://example.com/eligibility",
      valid_until: future,
      notes: "Test-only jurisdiction and product scope review.",
      ...extra,
    });

  test("Operations creates attributed records and reuses existing supplier diligence", async () => {
    await asUser(analyst, async (db) => {
      const organization = (
        await db.query(
          "insert into intel_organizations(legal_name,kind,location) values('Ops test supplier','Manufacturer','Test location') returning id",
        )
      ).rows[0].id;
      supplier = (
        await db.query(
          "insert into intel_suppliers(organization_id,classification,manufacturing_locations,owner_id,next_action,coa_available,quality_documentation,traceability,verification) values($1,'Manufacturer','Test facility',$2,'Test records',true,'Documented test quality scope','Documented test traceability','Independently verified') returning id",
          [organization, analyst],
        )
      ).rows[0].id;
      await db.query(
        "insert into intel_documents(supplier_id,name,storage_path,content_type,bytes,verified_at,verified_by,verification_notes) values($1,'Test document',$2,'text/plain',100,now(),$3,'Documented test verification findings')",
        [supplier, `${supplier}/ops-test.txt`, analyst],
      );
      await db.query(
        "select intel_review_supplier($1,'Approved','Documented test review of all six qualification gates.',array['identity','classification','quality','traceability','commercial','pilot'],true)",
        [supplier],
      );
    });
    practice = await run(analyst, "practice", {
      legal_name: "Test practice",
      state: "NY",
      business_email: "ops@example.com",
      website: "https://example.com",
      scope: "Test practice supply coordination.",
    });
    product = await run(analyst, "product", {
      name: "Test practice supply",
      sku: "OPS-TEST-01",
      supplier_id: supplier,
      kind: "Practice supplies",
      unit: "case",
      description: "General practice supply for database testing.",
    });
    request = await newRequest();
    const row = (
      await pool().query(
        "select stage,created_by from ops_requests where id=$1",
        [request],
      )
    ).rows[0];
    assert.equal(row.stage, "Draft");
    assert.equal(row.created_by, analyst);
    await transition(request, 1, "Review");
    await assert.rejects(
      transition(request, 2, "Ready"),
      /Practice onboarding/,
    );
    assert.equal(
      (
        await pool().query(
          "select count(*) from ops_events where entity_id=$1",
          [request],
        )
      ).rows[0].count,
      "2",
    );
  });
  test("Operations denies anonymous, non-member and viewer writes, direct table writes and audit tampering", async () => {
    for (const actor of [viewer, outsider])
      await assert.rejects(
        run(actor, "practice", { legal_name: "Forbidden" }),
        /Writer access/,
      );
    for (const table of [
      "ops_practices",
      "ops_products",
      "ops_requests",
      "ops_eligibility",
      "ops_events",
    ]) {
      await asUser(outsider, async (db) =>
        assert.equal((await db.query(`select * from ${table}`)).rowCount, 0),
      );
      await assert.rejects(
        asUser(analyst, (db) => db.query(`delete from ${table}`)),
        /permission denied/,
      );
    }
    await assert.rejects(
      asUser(admin, (db) =>
        db.query("update ops_practices set status='Ready' where id=$1", [
          practice,
        ]),
      ),
      /permission denied/,
    );
    await asUser(viewer, async (db) =>
      assert.equal((await db.query("select * from ops_practices")).rowCount, 1),
    );
    const db = await pool().connect();
    try {
      await db.query("begin; set local role anon");
      assert.equal((await db.query("select * from ops_requests")).rowCount, 0);
      await assert.rejects(
        db.query("select ops_save('practice','{}')"),
        /permission denied/,
      );
    } finally {
      await db.query("rollback");
      db.release();
    }
  });
  test("only administrators can review practices and exact product/state/channel eligibility", async () => {
    const payload = {
      id: practice,
      version: 1,
      status: "Ready",
      evidence_url: "https://example.com/credentials",
      valid_until: future,
      notes: "Test-only credential and agreement review.",
    };
    await assert.rejects(
      run(analyst, "practice_review", payload),
      /administrator/,
    );
    await assert.rejects(
      run(admin, "practice_review", { ...payload, valid_until: "2000-01-01" }),
      /Current dated evidence/,
    );
    await run(admin, "practice_review", payload);
    const audit = (
      await pool().query(
        "select details from ops_events where entity_id=$1 and action='practice_review'",
        [practice],
      )
    ).rows[0].details;
    assert.equal(audit.evidence_url, payload.evidence_url);
    assert.equal(audit.reviewed_by, admin);
    assert.equal(audit.valid_until, future);
    await assert.rejects(
      transition(request, 2, "Ready"),
      /state and channel eligibility/,
    );
    await assert.rejects(run(analyst, "eligibility", {}), /administrator/);
    await review({ state: "CA" });
    await assert.rejects(
      transition(request, 2, "Ready"),
      /state and channel eligibility/,
    );
    await review();
    await transition(request, 2, "Ready");
    await assert.rejects(
      transition(request, 3, "Coordinating"),
      /handoff reference/,
    );
    await transition(request, 3, "Coordinating", {
      handoff_reference: "TEST-PARTNER-01",
    });
    await assert.rejects(
      transition(request, 4, "Completed", {
        handoff_reference: "TEST-PARTNER-01",
      }),
      /lot/,
    );
    await assert.rejects(
      transition(request, 4, "Completed", {
        handoff_reference: "TEST-PARTNER-01",
        lot_reference: "TEST-LOT",
        lot_expires_on: "2000-01-01",
      }),
      /lot/,
    );
    await transition(request, 4, "Completed", {
      handoff_reference: "TEST-PARTNER-01",
      lot_reference: "TEST-LOT",
      lot_expires_on: future,
    });
    await assert.rejects(transition(request, 5, "Review"), /unavailable/);
  });
  test("consumer planning has independent eligibility and cannot borrow practice approval", async () => {
    const consumer = await newRequest({
      channel: "Consumer",
      practice_id: null,
    });
    await transition(consumer, 1, "Review");
    await assert.rejects(transition(consumer, 2, "Ready"), /eligibility/);
    await review({ channel: "Consumer" });
    await transition(consumer, 2, "Ready");
    await assert.rejects(newRequest({ channel: "Consumer" }));
    const wrongState = await newRequest({ state: "CA" });
    await transition(wrongState, 1, "Review");
    await assert.rejects(
      transition(wrongState, 2, "Ready"),
      /practice location/,
    );
  });
  test("eligibility expiry and supplier suspension are rechecked at the handoff", async () => {
    const id = await newRequest();
    await transition(id, 1, "Review");
    await transition(id, 2, "Ready");
    await pool().query(
      "update ops_eligibility set valid_until='2000-01-01' where product_id=$1 and channel='Clinician'",
      [product],
    );
    await assert.rejects(
      transition(id, 3, "Coordinating", { handoff_reference: "TEST-PARTNER" }),
      /eligibility/,
    );
    await review();
    await asUser(analyst, (db) =>
      db.query("update intel_suppliers set stage='Under Review' where id=$1", [
        supplier,
      ]),
    );
    await assert.rejects(
      transition(id, 3, "Coordinating", { handoff_reference: "TEST-PARTNER" }),
      /Supplier/,
    );
    await transition(id, 3, "Hold");
    await asUser(analyst, (db) =>
      db.query(
        "select intel_review_supplier($1,'Approved','Documented supplier re-review after test suspension.',array['identity','classification','quality','traceability','commercial','pilot'],true)",
        [supplier],
      ),
    );
  });
  test("concurrent transitions use a version check and create exactly one audit event", async () => {
    const id = await newRequest();
    await transition(id, 1, "Review");
    const results = await Promise.allSettled([
      transition(id, 2, "Ready"),
      transition(id, 2, "Ready"),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(
      (
        await pool().query(
          "select count(*) from ops_events where entity_id=$1",
          [id],
        )
      ).rows[0].count,
      "3",
    );
  });
  test("product and practice edits invalidate reviews; medicine and RUO coordination remain gated", async () => {
    const id = await newRequest();
    await transition(id, 1, "Review");
    await run(analyst, "product", {
      id: product,
      version: 1,
      name: "Changed product scope",
      sku: "OPS-TEST-01",
      supplier_id: supplier,
      kind: "Practice supplies",
      unit: "case",
      description: "Changed scope requires a new eligibility review.",
    });
    await assert.rejects(transition(id, 2, "Ready"), /eligibility/);
    await assert.rejects(review(), /Product changed/);
    await review({ product_revision: 2 });
    await run(analyst, "practice", {
      id: practice,
      version: 2,
      legal_name: "Changed practice",
      state: "NY",
      business_email: "ops@example.com",
      website: "",
      scope: "Changed practice onboarding details.",
    });
    await assert.rejects(transition(id, 2, "Ready"), /Practice onboarding/);
    for (const kind of ["Prescription medicine", "Research use only"]) {
      const restricted = await run(analyst, "product", {
        name: `Test ${kind}`,
        sku: `TEST-${kind}`,
        supplier_id: supplier,
        kind,
        unit: "record",
        description: "Test-only restricted product classification.",
      });
      await assert.rejects(
        review({ product_id: restricted }),
        /licensed partner/,
      );
      const gatedRequest = await newRequest({ product_id: restricted });
      await transition(gatedRequest, 1, "Review");
      await assert.rejects(
        transition(gatedRequest, 2, "Ready"),
        /licensed partner/,
      );
    }
    await pool().query(
      "update intel_members set active=false where user_id=$1",
      [analyst],
    );
    await assert.rejects(newRequest(), /Writer access/);
    await pool().query(
      "update intel_members set active=true where user_id=$1",
      [analyst],
    );
  });
}
