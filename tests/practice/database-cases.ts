import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
type Harness = {
  pool: () => Pool;
  asUser: <T>(id: string, run: (db: PoolClient) => Promise<T>) => Promise<T>;
  admin: string;
  analyst: string;
  viewer: string;
  outsider: string;
};
export function practiceDatabaseTests({
  pool,
  asUser,
  admin,
  analyst,
  viewer,
  outsider,
}: Harness) {
  const first = "00000000-0000-4000-8000-000000000005",
    second = "00000000-0000-4000-8000-000000000006",
    reader = "00000000-0000-4000-8000-000000000007";
  const future = new Date(Date.now() + 90 * 86400000)
    .toISOString()
    .slice(0, 10);
  let ny: string,
    ca: string,
    product: string,
    offerNY: string,
    offerCA: string,
    memberNY: string,
    request: string;
  const rpc = (actor: string, name: string, payload: Record<string, unknown>) =>
    asUser(
      actor,
      async (db) =>
        (
          await db.query(`select ${name}($1::jsonb) result`, [
            JSON.stringify(payload),
          ])
        ).rows[0].result,
    );
  const snapshot = (actor: string, practice: string | null = null) =>
    asUser(
      actor,
      async (db) =>
        (await db.query("select ops_practice_snapshot($1) result", [practice]))
          .rows[0].result,
    );
  const submit = (extra = {}) => ({
    practice_id: ny,
    offer_id: offerNY,
    submission_key: randomUUID(),
    quantity: 2,
    needed_on: future,
    reference: "TEST-PRACTICE-REF",
    message: "Business coordination only.",
    ...extra,
  });
  const publish = (state: string, extra = {}) =>
    rpc(admin, "ops_publish_practice_offer", {
      product_id: product,
      product_revision: 1,
      expected_revision: 0,
      state,
      status: "Published",
      title: `Published ${state} supply`,
      summary: "Public practice supply description reviewed for this location.",
      valid_until: future,
      review_notes: "PRIVATE publication review and commercial notes.",
      ...extra,
    });
  test("practice accounts and reviewed publications are created only by administrators", async () => {
    await pool().query(
      "insert into auth.users(id,email) values($1,'first@example.com'),($2,'second@example.com'),($3,'reader@example.com')",
      [first, second, reader],
    );
    const supplier = await asUser(analyst, async (db) => {
      const organization = (
        await db.query(
          "insert into intel_organizations(legal_name,kind,location) values('PRIVATE portal supplier','Manufacturer','Test location') returning id",
        )
      ).rows[0].id;
      const id = (
        await db.query(
          "insert into intel_suppliers(organization_id,classification,manufacturing_locations,owner_id,next_action,coa_available,quality_documentation,traceability,verification) values($1,'Manufacturer','Test facility',$2,'Test records',true,'Test quality documentation','Test supplier traceability','Independently verified') returning id",
          [organization, analyst],
        )
      ).rows[0].id;
      await db.query(
        "insert into intel_documents(supplier_id,name,storage_path,content_type,bytes,verified_at,verified_by,verification_notes) values($1,'Test portal document',$2,'text/plain',100,now(),$3,'Independent test document review')",
        [id, `${id}/portal.txt`, analyst],
      );
      await db.query(
        "select intel_review_supplier($1,'Approved','Test all six supplier diligence gates for the practice workflow.',array['identity','classification','quality','traceability','commercial','pilot'],true)",
        [id],
      );
      return id;
    });
    for (const state of ["NY", "CA"]) {
      const practice = await asUser(
        analyst,
        async (db) =>
          (
            await db.query("select ops_save('practice',$1::jsonb) id", [
              JSON.stringify({
                legal_name: `Test ${state} practice`,
                state,
                business_email: "ops@example.com",
                website: "",
                scope: "PRIVATE practice onboarding requirements.",
              }),
            ])
          ).rows[0].id,
      );
      await asUser(admin, (db) =>
        db.query("select ops_save('practice_review',$1::jsonb)", [
          JSON.stringify({
            id: practice,
            version: 1,
            status: "Ready",
            evidence_url: "https://example.com/credentials",
            valid_until: future,
            notes: "PRIVATE practice credential review findings.",
          }),
        ]),
      );
      if (state === "NY") ny = practice;
      else ca = practice;
    }
    product = await asUser(
      analyst,
      async (db) =>
        (
          await db.query("select ops_save('product',$1::jsonb) id", [
            JSON.stringify({
              name: "PRIVATE internal product name",
              sku: "PRIVATE-PORTAL-SKU",
              supplier_id: supplier,
              kind: "Practice supplies",
              unit: "case",
              description:
                "PRIVATE product diligence and internal commercial context.",
            }),
          ])
        ).rows[0].id,
    );
    for (const state of ["NY", "CA"])
      await asUser(admin, (db) =>
        db.query("select ops_save('eligibility',$1::jsonb)", [
          JSON.stringify({
            product_id: product,
            product_revision: 1,
            state,
            channel: "Clinician",
            status: "Approved",
            evidence_url: "https://example.com/eligibility",
            valid_until: future,
            notes: "PRIVATE eligibility notes and legal scope.",
          }),
        ]),
      );
    await assert.rejects(
      rpc(analyst, "ops_manage_practice_access", {
        practice_id: ny,
        email: "first@example.com",
        role: "requester",
        active: true,
      }),
      /Administrator/,
    );
    memberNY = await rpc(admin, "ops_manage_practice_access", {
      practice_id: ny,
      email: "first@example.com",
      role: "requester",
      active: true,
    });
    await assert.rejects(
      rpc(admin, "ops_manage_practice_access", {
        practice_id: ny,
        email: "missing@example.com",
        role: "viewer",
        active: true,
      }),
      /Create this person/,
    );
    await pool().query(
      "insert into auth.users(id,email) values($1,'ambiguous@example.com'),($2,'ambiguous@example.com')",
      [randomUUID(), randomUUID()],
    );
    await assert.rejects(
      rpc(admin, "ops_manage_practice_access", {
        practice_id: ny,
        email: "ambiguous@example.com",
        role: "viewer",
        active: true,
      }),
      /exactly one/,
    );
    await rpc(admin, "ops_manage_practice_access", {
      practice_id: ca,
      email: "second@example.com",
      role: "requester",
      active: true,
    });
    await rpc(admin, "ops_manage_practice_access", {
      practice_id: ny,
      email: "reader@example.com",
      role: "viewer",
      active: true,
    });
    await assert.rejects(
      rpc(analyst, "ops_publish_practice_offer", {}),
      /Administrator/,
    );
    offerNY = await publish("NY");
    offerCA = await publish("CA");
  });
  test("portal projections isolate practices and never expose internal notes, supplier records or SKUs", async () => {
    const data = await snapshot(first, ny);
    assert.equal(data.practices.length, 1);
    assert.equal(data.role, "requester");
    assert.equal(data.practices[0].id, ny);
    assert.equal(data.offers.length, 1);
    assert.equal(data.offers[0].id, offerNY);
    assert.equal(JSON.stringify(data).includes("PRIVATE"), false);
    await assert.rejects(snapshot(first, ca), /Practice access/);
    await assert.rejects(snapshot(outsider, ny), /Practice access/);
    await assert.rejects(snapshot(admin, ny), /Practice access/);
    for (const table of [
      "ops_requests",
      "ops_products",
      "ops_practice_offers",
      "ops_practice_members",
      "ops_practice_updates",
      "intel_suppliers",
    ]) {
      await asUser(first, async (db) =>
        assert.equal((await db.query(`select * from ${table}`)).rowCount, 0),
      );
      if (table === "intel_suppliers") {
        await asUser(first, async (db) =>
          assert.equal((await db.query(`delete from ${table}`)).rowCount, 0),
        );
      } else {
        await assert.rejects(
          asUser(first, (db) => db.query(`delete from ${table}`)),
          /permission denied/,
        );
      }
    }
  });
  test("request submission validates membership, location, publication and requester permission", async () => {
    await assert.rejects(
      rpc(
        first,
        "ops_practice_submit",
        submit({ practice_id: ca, offer_id: offerCA }),
      ),
      /permission/,
    );
    await assert.rejects(
      rpc(first, "ops_practice_submit", submit({ offer_id: offerCA })),
      /not available/,
    );
    await assert.rejects(
      rpc(reader, "ops_practice_submit", submit()),
      /permission/,
    );
    await assert.rejects(
      rpc(first, "ops_practice_submit", submit({ needed_on: "2000-01-01" })),
      /next year/,
    );
    request = await rpc(
      first,
      "ops_practice_submit",
      submit({ created_by: admin }),
    );
    const row = (
      await pool().query(
        "select created_by,stage from ops_requests where id=$1",
        [request],
      )
    ).rows[0];
    assert.equal(row.created_by, first);
    assert.equal(row.stage, "Review");
    const data = await snapshot(first, ny);
    assert.equal(data.requests[0].title, "Published NY supply");
    assert.equal(JSON.stringify(data).includes("PRIVATE"), false);
    await assert.rejects(
      rpc(second, "ops_practice_cancel", {
        request_id: request,
        version: 1,
        reason: "Cancel another practice request.",
      }),
      /unavailable/,
    );
  });
  test("concurrent retries are idempotent and altered payloads cannot reuse the same submission key", async () => {
    const payload = submit();
    const results = await Promise.all([
      rpc(first, "ops_practice_submit", payload),
      rpc(first, "ops_practice_submit", payload),
    ]);
    assert.equal(results[0], results[1]);
    assert.equal(
      (
        await pool().query(
          "select count(*) from ops_events where entity_id=$1",
          [results[0]],
        )
      ).rows[0].count,
      "1",
    );
    await assert.rejects(
      rpc(first, "ops_practice_submit", { ...payload, quantity: 3 }),
      /already been used/,
    );
  });
  test("public status updates and explicit practice messages exclude internal transition notes", async () => {
    await asUser(analyst, (db) =>
      db.query("select ops_save('transition',$1::jsonb)", [
        JSON.stringify({
          id: request,
          version: 1,
          stage: "Ready",
          notes: "PRIVATE transition notes and commercial details.",
          handoff_reference: "",
          lot_reference: "",
          lot_expires_on: "",
        }),
      ]),
    );
    await rpc(analyst, "ops_post_practice_update", {
      request_id: request,
      body: "Your coordination request has been reviewed.",
    });
    await assert.rejects(
      rpc(viewer, "ops_post_practice_update", {
        request_id: request,
        body: "Forbidden public update.",
      }),
      /Writer/,
    );
    const data = await snapshot(first, ny);
    assert.equal(JSON.stringify(data).includes("PRIVATE"), false);
    assert.ok(
      data.updates.some(
        (u: { body: string }) =>
          u.body === "Your coordination request has been reviewed.",
      ),
    );
    assert.ok(
      data.updates.some(
        (u: { body: string }) =>
          u.body === "Reviewed and ready for coordination.",
      ),
    );
    assert.equal((await snapshot(second, ca)).requests.length, 0);
  });
  test("practice cancellation is attributed and limited to review or hold stages", async () => {
    await assert.rejects(
      rpc(first, "ops_practice_cancel", {
        request_id: request,
        version: 2,
        reason: "This request is already reviewed.",
      }),
      /beyond/,
    );
    const id = await rpc(first, "ops_practice_submit", submit());
    await assert.rejects(
      rpc(reader, "ops_practice_cancel", {
        request_id: id,
        version: 1,
        reason: "A viewer cannot cancel this request.",
      }),
      /unavailable/,
    );
    await assert.rejects(
      rpc(first, "ops_practice_cancel", {
        request_id: id,
        version: 2,
        reason: "Stale version cannot cancel a request.",
      }),
      /changed/,
    );
    await rpc(first, "ops_practice_cancel", {
      request_id: id,
      version: 1,
      reason: "Our practice no longer needs this supply.",
    });
    assert.equal(
      (await pool().query("select stage from ops_requests where id=$1", [id]))
        .rows[0].stage,
      "Cancelled",
    );
  });
  test("expired, paused and changed product publications disappear while request history is retained", async () => {
    await publish("NY", { expected_revision: 1, status: "Paused" });
    assert.equal((await snapshot(first, ny)).offers.length, 0);
    assert.ok((await snapshot(first, ny)).requests.length > 0);
    await assert.rejects(
      rpc(first, "ops_practice_submit", submit()),
      /not available/,
    );
    await publish("NY", { expected_revision: 2 });
    await pool().query(
      "update ops_eligibility set valid_until='2000-01-01' where product_id=$1",
      [product],
    );
    assert.equal((await snapshot(first, ny)).offers.length, 0);
    await assert.rejects(
      rpc(first, "ops_practice_submit", submit()),
      /eligibility/,
    );
    await pool().query(
      "update ops_eligibility set valid_until=$1 where product_id=$2",
      [future, product],
    );
    await pool().query(
      "update ops_products set revision=revision+1 where id=$1",
      [product],
    );
    assert.equal((await snapshot(first, ny)).offers.length, 0);
  });
  test("revoking membership immediately removes access even when the Auth identity still exists", async () => {
    await rpc(admin, "ops_manage_practice_access", {
      id: memberNY,
      version: 1,
      practice_id: ny,
      email: "first@example.com",
      role: "requester",
      active: false,
    });
    await assert.rejects(snapshot(first, ny), /Practice access/);
    await assert.rejects(
      rpc(first, "ops_practice_submit", submit()),
      /permission/,
    );
    assert.equal(
      (
        await pool().query("select count(*) from auth.users where id=$1", [
          first,
        ])
      ).rows[0].count,
      "1",
    );
  });
}
