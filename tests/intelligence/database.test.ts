import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { Pool, type PoolClient } from "pg";
let pool: Pool;
const container = `siona-intel-test-${process.pid}`;
const admin = "00000000-0000-4000-8000-000000000001",
  analyst = "00000000-0000-4000-8000-000000000002",
  viewer = "00000000-0000-4000-8000-000000000003",
  outsider = "00000000-0000-4000-8000-000000000004";
let signal: string, opportunity: string, organization: string, supplier: string;
const dockerEnv = { ...process.env };
for (const key of [
  "DOCKER_HOST",
  "DOCKER_CONTEXT",
  "DOCKER_TLS",
  "DOCKER_TLS_VERIFY",
  "DOCKER_CERT_PATH",
])
  delete dockerEnv[key];
const docker = (args: string[], env = dockerEnv) =>
  execFileSync("docker", ["--host=unix:///var/run/docker.sock", ...args], {
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
async function asUser<T>(id: string, run: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("set local role authenticated");
    await client.query("select set_config('request.jwt.claim.sub',$1,true)", [
      id,
    ]);
    const result = await run(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
before(
  async () => {
    const password = randomBytes(24).toString("hex");
    docker(
      [
        "run",
        "-d",
        "--rm",
        "--name",
        container,
        "-p",
        "127.0.0.1::5432",
        "-e",
        "POSTGRES_PASSWORD",
        "-e",
        "POSTGRES_DB=siona_engine_test",
        "postgres:17-alpine",
      ],
      { ...dockerEnv, POSTGRES_PASSWORD: password },
    );
    const port = Number(
      docker(["port", container, "5432/tcp"]).split(":").at(-1),
    );
    pool = new Pool({
      host: "127.0.0.1",
      port,
      database: "siona_engine_test",
      user: "postgres",
      password,
      connectionTimeoutMillis: 1000,
    });
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try {
        await pool.query("select 1");
        ready = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 250));
      }
    }
    assert.ok(ready, "Disposable PostgreSQL must become ready");
    await pool.query(readFileSync("tests/intelligence/bootstrap.sql", "utf8"));
    await pool.query(
      readFileSync(
        "supabase/migrations/202611080001_evolution_engine.sql",
        "utf8",
      ),
    );
    await pool.query("grant select on all tables in schema public to anon");
    await pool.query("insert into auth.users(id) values($1),($2),($3),($4)", [
      admin,
      analyst,
      viewer,
      outsider,
    ]);
    await pool.query(
      "insert into intel_members(user_id,display_name,role) values($1,'Admin','admin'),($2,'Analyst','analyst'),($3,'Viewer','viewer')",
      [admin, analyst, viewer],
    );
  },
  { timeout: 60000 },
);
after(async () => {
  await pool?.end();
  try {
    docker(["rm", "-f", container]);
  } catch {
    /* The container may not have started. */
  }
});

test("an authenticated analyst can create a signal and atomically convert it into an evidenced opportunity", async () => {
  await asUser(analyst, async (db) => {
    signal = (
      await db.query(
        "insert into intel_signals(title,summary,source_url,publisher,published_on,industry,geography,evidence_type,reliability,reliability_notes,why_matters,siona_relevance,confidence) values('Test signal','Source-backed test material','https://example.com/test','Test publisher',current_date,'Research supply','Test','third_party_claim','unverified','Test reliability notes','Test why it matters','Test relevance','low') returning id",
      )
    ).rows[0].id;
    const payload = {
      title: "Test opportunity",
      problem: "Test a documentation problem.",
      affected: "Test buyers",
      proposition: "Test a service hypothesis.",
      customers: "No actual customers.",
      assumptions: "The problem is not solved today.",
      invalidation: "Interviews find no unmet need.",
    };
    opportunity = (
      await db.query(
        "select intel_create_opportunity($1::jsonb,$2::uuid[]) id",
        [JSON.stringify(payload), [signal]],
      )
    ).rows[0].id;
    assert.equal(
      (
        await db.query(
          "select count(*) from intel_evidence where opportunity_id=$1",
          [opportunity],
        )
      ).rows[0].count,
      "1",
    );
  });
});
test("conversion rolls back on invalid evidence instead of creating an orphan hypothesis", async () => {
  const before = Number(
    (await pool.query("select count(*) from intel_opportunities")).rows[0]
      .count,
  );
  await assert.rejects(
    asUser(analyst, (db) =>
      db.query("select intel_create_opportunity($1::jsonb,$2::uuid[])", [
        JSON.stringify({
          title: "Orphan",
          problem: "Test",
          affected: "Test",
          proposition: "Test",
          customers: "Test",
          assumptions: "Test",
          invalidation: "Test",
        }),
        [outsider],
      ]),
    ),
  );
  assert.equal(
    Number(
      (await pool.query("select count(*) from intel_opportunities")).rows[0]
        .count,
    ),
    before,
  );
});
test("outsiders cannot read internal records or insert records", async () => {
  await asUser(outsider, async (db) =>
    assert.equal((await db.query("select * from intel_signals")).rowCount, 0),
  );
  await assert.rejects(
    asUser(outsider, (db) =>
      db.query(
        "insert into intel_organizations(legal_name,kind,location) values('Forbidden','Manufacturer','Test')",
      ),
    ),
  );
});
test("viewers can read but cannot mutate data, weights, members, or audit history", async () => {
  await asUser(viewer, async (db) =>
    assert.equal((await db.query("select * from intel_signals")).rowCount, 1),
  );
  await assert.rejects(
    asUser(viewer, (db) =>
      db.query(
        "insert into intel_organizations(legal_name,kind,location) values('Forbidden','Manufacturer','Test')",
      ),
    ),
  );
  await asUser(viewer, async (db) =>
    assert.equal(
      (await db.query("update intel_weights set weight=99 returning *"))
        .rowCount,
      0,
    ),
  );
  await assert.rejects(
    asUser(analyst, (db) =>
      db.query("update intel_members set role='admin' where user_id=$1", [
        analyst,
      ]),
    ),
  );
  await assert.rejects(
    asUser(analyst, (db) => db.query("delete from intel_activity")),
  );
});
test("opportunity lifecycle requires a documented, attributed decision with evidence", async () => {
  await assert.rejects(
    asUser(analyst, (db) =>
      db.query("update intel_opportunities set stage='Active' where id=$1", [
        opportunity,
      ]),
    ),
  );
  await asUser(analyst, async (db) => {
    await db.query("select intel_record_decision($1::jsonb,$2::uuid[])", [
      JSON.stringify({
        opportunity_id: opportunity,
        stage: "Validating",
        rationale: "Test buyer interviews before committing resources.",
        assumptions_changed: "No actual buyer evidence yet.",
      }),
      [signal],
    ]);
    assert.equal(
      (
        await db.query("select stage from intel_opportunities where id=$1", [
          opportunity,
        ])
      ).rows[0].stage,
      "Validating",
    );
    assert.equal(
      (
        await db.query(
          "select created_by from intel_decisions where opportunity_id=$1",
          [opportunity],
        )
      ).rows[0].created_by,
      analyst,
    );
  });
});
test("evaluation preserves missing values and all nine underlying rationales", async () => {
  const scores = [
    "demand",
    "market",
    "differentiation",
    "economics",
    "feasibility",
    "fit",
    "regulatory",
    "capital",
    "evidence",
  ].map((criterion) => ({
    criterion,
    score: criterion === "fit" ? 3 : null,
    rationale: "Missing evidence; test the assumption.",
  }));
  await asUser(analyst, async (db) => {
    await db.query("select intel_save_evaluation($1,$2::jsonb)", [
      opportunity,
      JSON.stringify(scores),
    ]);
    const rows = (
      await db.query(
        "select * from intel_evaluations where opportunity_id=$1",
        [opportunity],
      )
    ).rows;
    assert.equal(rows.length, 9);
    assert.equal(rows.filter((r) => r.score === null).length, 8);
  });
});
test("supplier qualification is blocked without verified documents and documented human review", async () => {
  await asUser(analyst, async (db) => {
    organization = (
      await db.query(
        "insert into intel_organizations(legal_name,kind,location) values('Test legal organization','Manufacturer','Test location') returning id",
      )
    ).rows[0].id;
    supplier = (
      await db.query(
        "insert into intel_suppliers(organization_id,classification,manufacturing_locations,owner_id,next_action,coa_available,quality_documentation,traceability,verification) values($1,'Manufacturer','Test facility',$2,'Request documents',true,'Test quality documentation','Test lot traceability','Independently verified') returning id",
        [organization, analyst],
      )
    ).rows[0].id;
  });
  await assert.rejects(
    asUser(analyst, (db) =>
      db.query("update intel_suppliers set stage='Approved' where id=$1", [
        supplier,
      ]),
    ),
  );
  await assert.rejects(
    asUser(analyst, (db) =>
      db.query(
        "select intel_review_supplier($1,'Qualified','A documented rationale for a human review',array['identity','classification','quality','traceability','commercial','pilot'],true)",
        [supplier],
      ),
    ),
  );
  await asUser(analyst, async (db) => {
    await db.query(
      "insert into intel_documents(supplier_id,name,storage_path,content_type,bytes,verified_at,verified_by,verification_notes) values($1,'Test COA',$2,'application/pdf',100,now(),$3,'Test independent verification findings')",
      [supplier, `${supplier}/test.pdf`, analyst],
    );
    await db.query(
      "select intel_review_supplier($1,'Qualified','All six human diligence gates reviewed with supporting evidence.',array['identity','classification','quality','traceability','commercial','pilot'],true)",
      [supplier],
    );
    assert.equal(
      (
        await db.query("select stage from intel_suppliers where id=$1", [
          supplier,
        ])
      ).rows[0].stage,
      "Qualified",
    );
  });
});
test("suppliers, institutions and validation tasks can be linked to an opportunity", async () => {
  await asUser(analyst, async (db) => {
    await db.query(
      "insert into intel_links(opportunity_id,supplier_id,rationale) values($1,$2,'Test proposed supplier relationship')",
      [opportunity, supplier],
    );
    await db.query(
      "insert into intel_links(opportunity_id,organization_id,rationale) values($1,$2,'Test institutional relationship')",
      [opportunity, organization],
    );
    await db.query(
      "insert into intel_tasks(title,opportunity_id,owner_id,due_on,kind,success_criteria) values('Interview test buyer',$1,$2,current_date+7,'Validation','Document evidence that would invalidate the hypothesis')",
      [opportunity, analyst],
    );
    assert.equal(
      (
        await db.query(
          "select count(*) from intel_links where opportunity_id=$1",
          [opportunity],
        )
      ).rows[0].count,
      "2",
    );
  });
});
test("private storage rejects outsiders and invalid supplier paths", async () => {
  assert.equal(
    (
      await pool.query(
        "select public from storage.buckets where id='intel-supplier-documents'",
      )
    ).rows[0].public,
    false,
  );
  await assert.rejects(
    asUser(outsider, (db) =>
      db.query(
        "insert into storage.objects(bucket_id,name) values('intel-supplier-documents',$1)",
        [`${supplier}/bad.pdf`],
      ),
    ),
  );
  await assert.rejects(
    asUser(analyst, (db) =>
      db.query(
        "insert into storage.objects(bucket_id,name) values('intel-supplier-documents','not-a-supplier/test.pdf')",
      ),
    ),
  );
  await asUser(analyst, (db) =>
    db.query(
      "insert into storage.objects(bucket_id,name) values('intel-supplier-documents',$1)",
      [`${supplier}/test.pdf`],
    ),
  );
  await asUser(outsider, async (db) =>
    assert.equal(
      (
        await db.query(
          "select * from storage.objects where bucket_id='intel-supplier-documents'",
        )
      ).rowCount,
      0,
    ),
  );
});
test("synthetic data removal preserves real data and refuses to delete referenced demo records", async () => {
  const real = (await pool.query("select count(*) from intel_opportunities"))
    .rows[0].count;
  await asUser(analyst, async (db) => {
    await db.query("select intel_seed_demo()");
    await db.query("select intel_clear_demo()");
  });
  assert.equal(
    (await pool.query("select count(*) from intel_opportunities")).rows[0]
      .count,
    real,
  );
  await asUser(analyst, (db) => db.query("select intel_seed_demo()"));
  const demo = (
    await pool.query(
      "select id from intel_opportunities where demo_batch_id is not null",
    )
  ).rows[0].id;
  await asUser(analyst, (db) =>
    db.query(
      "insert into intel_tasks(title,opportunity_id,owner_id,due_on,kind,success_criteria) values('Real record using demo',$1,$2,current_date,'Research','Do not remove this real record')",
      [demo, analyst],
    ),
  );
  await assert.rejects(
    asUser(analyst, (db) => db.query("select intel_clear_demo()")),
  );
  assert.equal(
    (await pool.query("select id from intel_opportunities where id=$1", [demo]))
      .rowCount,
    1,
  );
});
test("source approval, document attribution, and follow-up transactions are enforced", async () => {
  await assert.rejects(
    asUser(analyst, (db) =>
      db.query(
        "insert into intel_sources(name,url,publisher,adapter,approved) values('Forbidden source','https://example.com/test','Test','federal-register',true)",
      ),
    ),
  );
  await asUser(admin, (db) =>
    db.query(
      "insert into intel_sources(name,url,publisher,adapter,approved) values('Approved source','https://example.com/test','Test','manual',true)",
    ),
  );
  await assert.rejects(
    asUser(analyst, (db) =>
      db.query(
        "insert into intel_documents(supplier_id,name,storage_path,content_type,bytes,verified_at,verified_by,verification_notes) values($1,'Forged reviewer',$2,'text/plain',20,now(),$3,'Pretend review by another member')",
        [supplier, `${supplier}/forged.txt`, admin],
      ),
    ),
  );
  await asUser(analyst, async (db) => {
    await db.query("select intel_log_relationship($1::jsonb)", [
      JSON.stringify({
        organization_id: organization,
        opportunity_id: opportunity,
        body: "Documented test conversation.",
        next_action: "Clarify requirements with buyer",
        follow_up_on: "2026-12-01",
        owner_id: analyst,
      }),
    ]);
    assert.equal(
      (
        await db.query(
          "select count(*) from intel_tasks where organization_id=$1 and kind='Follow-up'",
          [organization],
        )
      ).rows[0].count,
      "1",
    );
  });
  const db = await pool.connect();
  try {
    await db.query("begin");
    await db.query("set local role anon");
    assert.equal((await db.query("select * from intel_signals")).rowCount, 0);
    await db.query("rollback");
  } finally {
    db.release();
  }
});
test("migration and rollback preserve pre-existing application tables", async () => {
  assert.equal(
    (await pool.query("select note from passport_preservation_marker")).rows[0]
      .note,
    "Existing application data must remain untouched",
  );
  await pool.query(
    readFileSync("supabase/rollback/202611080001_evolution_engine.sql", "utf8"),
  );
  assert.equal(
    (await pool.query("select count(*) from passport_preservation_marker"))
      .rows[0].count,
    "1",
  );
});
