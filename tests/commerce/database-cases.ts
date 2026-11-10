import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Pool, PoolClient } from "pg";
type Harness = {
  pool: () => Pool;
  asUser: <T>(id: string, run: (db: PoolClient) => Promise<T>) => Promise<T>;
  admin: string;
  analyst: string;
  viewer: string;
  outsider: string;
};
export function commerceDatabaseTests({
  pool,
  asUser,
  admin,
  analyst,
  viewer,
  outsider,
}: Harness) {
  const first = randomUUID(),
    second = randomUUID(),
    reader = randomUUID();
  const today = new Date().toISOString().slice(0, 10),
    future = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  let ny: string,
    ca: string,
    offerNY: string,
    offerCA: string,
    product: string,
    supplier: string,
    request: string,
    rfq: string,
    quote: string,
    shipment: string,
    recall: string;
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
  const op = (
    actor: string,
    action: string,
    payload: Record<string, unknown>,
  ) =>
    asUser(
      actor,
      async (db) =>
        (
          await db.query("select ops_commerce_save($1,$2::jsonb) result", [
            action,
            JSON.stringify(payload),
          ])
        ).rows[0].result,
    );
  const core = (
    actor: string,
    action: string,
    payload: Record<string, unknown>,
  ) =>
    asUser(
      actor,
      async (db) =>
        (
          await db.query("select ops_save($1,$2::jsonb) result", [
            action,
            JSON.stringify(payload),
          ])
        ).rows[0].result,
    );
  const snapshot = (actor: string, location: string) =>
    asUser(
      actor,
      async (db) =>
        (await db.query("select ops_commerce_snapshot($1) result", [location]))
          .rows[0].result,
    );
  const row = async (table: string, id: string) =>
    (await pool().query(`select * from ${table} where id=$1`, [id])).rows[0];
  const createRequest = (actor = first, location = ny, offer = offerNY) =>
    rpc(actor, "ops_practice_submit", {
      practice_id: location,
      offer_id: offer,
      submission_key: randomUUID(),
      quantity: 2,
      needed_on: future,
      reference: "COMMERCE-TEST",
      message: "Test business coordination only.",
    });
  const draft = (targetRfq: string, extra = {}) =>
    op(analyst, "quote", {
      rfq_id: targetRfq,
      supplier_reference: "PRIVATE-SUPPLIER-QUOTE",
      source_url: "https://example.com/PRIVATE-evidence",
      currency: "USD",
      unit_minor: 1250,
      shipping_minor: 500,
      tax_minor: 0,
      lead_days: 3,
      valid_until: future,
      delivery_terms:
        "Delivery to the practice business location under reviewed terms.",
      practice_summary:
        "Reviewed fictional supply quote for this test request.",
      internal_notes: "PRIVATE supplier negotiation and cost notes.",
      ...extra,
    });
  async function readyShipment(actor = first, location = ny, offer = offerNY) {
    const r = await createRequest(actor, location, offer);
    const f = await op(analyst, "rfq", {
      request_id: r,
      request_version: 1,
      reference: randomUUID(),
      due_on: future,
      notes: "PRIVATE documented supplier quote request.",
    });
    const q = await draft(f);
    await op(admin, "quote_status", {
      quote_id: q,
      version: 1,
      status: "Shared",
      notes: "Reviewed source pricing and every quoted charge.",
    });
    await rpc(actor, "ops_practice_quote_decide", {
      quote_id: q,
      quote_version: 2,
      request_version: 2,
      decision: "Accept",
      confirmed: true,
      notes: "Practice accepted the reviewed terms for coordination.",
    });
    await core(analyst, "transition", {
      id: r,
      version: 3,
      stage: "Ready",
      notes: "Current quote and operating reviews are complete.",
      handoff_reference: "",
      lot_reference: "",
      lot_expires_on: "",
    });
    const s = await op(analyst, "handoff", {
      request_id: r,
      request_version: 4,
      quantity: 2,
      partner_reference: "PRIVATE-PARTNER-REF",
      carrier: "Test carrier",
      tracking_reference: "TEST-TRACKING",
      expected_on: future,
      notes: "Documented partner coordination handoff.",
    });
    return { request: r, quote: q, shipment: s };
  }
  test("commerce upgrades preserve existing requests while new requests require accepted quotes", async () => {
    const count = (await pool().query("select count(*) from ops_requests"))
      .rows[0].count;
    await pool().query(
      readFileSync("supabase/migrations/202611100003_commerce.sql", "utf8"),
    );
    assert.equal(
      (
        await pool().query(
          "select count(*) from ops_requests where not quote_required",
        )
      ).rows[0].count,
      count,
    );
    await pool().query(
      "insert into auth.users(id,email) values($1,'commerce-a@example.com'),($2,'commerce-b@example.com'),($3,'commerce-reader@example.com')",
      [first, second, reader],
    );
    supplier = await asUser(analyst, async (db) => {
      const org = (
        await db.query(
          "insert into intel_organizations(legal_name,kind,location) values('PRIVATE commerce source','Manufacturer','Test facility') returning id",
        )
      ).rows[0].id;
      const s = (
        await db.query(
          "insert into intel_suppliers(organization_id,classification,manufacturing_locations,owner_id,next_action,coa_available,quality_documentation,traceability,verification) values($1,'Manufacturer','Test facility',$2,'Record source terms',true,'Test source quality documentation','Test source lot traceability','Independently verified') returning id",
          [org, analyst],
        )
      ).rows[0].id;
      await db.query(
        "insert into intel_documents(supplier_id,name,storage_path,content_type,bytes,verified_at,verified_by,verification_notes) values($1,'Commerce source document',$2,'text/plain',100,now(),$3,'Test source verification findings')",
        [s, `${s}/commerce.txt`, analyst],
      );
      await db.query(
        "select intel_review_supplier($1,'Approved','All six source review gates checked for the commerce test.',array['identity','classification','quality','traceability','commercial','pilot'],true)",
        [s],
      );
      return s;
    });
    product = await core(analyst, "product", {
      name: "PRIVATE internal supply",
      sku: "COMMERCE-TEST-SKU",
      supplier_id: supplier,
      kind: "Practice supplies",
      unit: "case",
      description: "PRIVATE internal source documentation scope.",
    });
    for (const state of ["NY", "CA"]) {
      const practice = await core(analyst, "practice", {
        legal_name: `Commerce ${state} practice`,
        state,
        business_email: "ops@example.com",
        website: "",
        scope: "PRIVATE business onboarding scope.",
      });
      await core(admin, "practice_review", {
        id: practice,
        version: 1,
        status: "Ready",
        evidence_url: "https://example.com/credentials",
        valid_until: future,
        notes: "PRIVATE credential and agreement review findings.",
      });
      await core(admin, "eligibility", {
        product_id: product,
        product_revision: 1,
        state,
        channel: "Clinician",
        status: "Approved",
        evidence_url: "https://example.com/eligibility",
        valid_until: future,
        notes: "PRIVATE state and classification review findings.",
      });
      const offer = await rpc(admin, "ops_publish_practice_offer", {
        product_id: product,
        product_revision: 1,
        expected_revision: 0,
        state,
        status: "Published",
        title: `Published ${state} commerce supply`,
        summary: "Fictional catalog scope for business supply coordination.",
        valid_until: future,
        review_notes: "PRIVATE catalog publication review findings.",
      });
      await rpc(admin, "ops_manage_practice_access", {
        practice_id: practice,
        email:
          state === "NY" ? "commerce-a@example.com" : "commerce-b@example.com",
        role: "requester",
        active: true,
      });
      if (state === "NY") {
        ny = practice;
        offerNY = offer;
      } else {
        ca = practice;
        offerCA = offer;
      }
    }
    await rpc(admin, "ops_manage_practice_access", {
      practice_id: ny,
      email: "commerce-reader@example.com",
      role: "viewer",
      active: true,
    });
    request = await createRequest();
    assert.equal((await row("ops_requests", request)).quote_required, true);
    await assert.rejects(
      core(analyst, "transition", {
        id: request,
        version: 1,
        stage: "Ready",
        notes: "Cannot skip a required accepted quote.",
        handoff_reference: "",
        lot_reference: "",
        lot_expires_on: "",
      }),
      /accepted quote/,
    );
  });
  test("quotes keep exact monetary amounts, require explicit fees and remain private until reviewed", async () => {
    rfq = await op(analyst, "rfq", {
      request_id: request,
      request_version: 1,
      reference: "PRIVATE-RFQ-REF",
      due_on: future,
      notes: "PRIVATE quote request and negotiation context.",
    });
    await assert.rejects(draft(rfq, { shipping_minor: null }));
    await assert.rejects(draft(rfq, { unit_minor: 12.5 }));
    await assert.rejects(draft(rfq, { currency: "JPY" }));
    quote = await draft(rfq);
    assert.equal(Number((await row("ops_quotes", quote)).total_minor), 3000);
    assert.equal((await snapshot(first, ny)).quotes.length, 0);
    await assert.rejects(
      op(analyst, "quote_status", {
        quote_id: quote,
        version: 1,
        status: "Shared",
        notes: "An analyst cannot publish reviewed prices.",
      }),
      /Administrator/,
    );
    const expired = await draft(rfq, { valid_until: "2000-01-01" });
    await assert.rejects(
      op(admin, "quote_status", {
        quote_id: expired,
        version: 1,
        status: "Shared",
        notes: "Expired terms cannot be published to a practice.",
      }),
      /expired/,
    );
    await op(admin, "quote_status", {
      quote_id: quote,
      version: 1,
      status: "Shared",
      notes: "Verified original supplier reference, currency and all charges.",
    });
    const view = await snapshot(first, ny);
    assert.equal(view.quotes.length, 1);
    assert.equal(view.quotes[0].total_minor, 3000);
    assert.equal(JSON.stringify(view).includes("PRIVATE"), false);
  });
  test("quote decisions enforce practice isolation, role, versions and explicit acceptance", async () => {
    const payload = {
      quote_id: quote,
      quote_version: 2,
      request_version: 2,
      decision: "Accept",
      confirmed: true,
      notes: "Practice accepted these quoted business terms.",
    };
    await assert.rejects(
      rpc(second, "ops_practice_quote_decide", payload),
      /unavailable/,
    );
    await assert.rejects(
      rpc(reader, "ops_practice_quote_decide", payload),
      /unavailable/,
    );
    await assert.rejects(
      op(admin, "internal_accept", payload),
      /authorized practice requester/,
    );
    await assert.rejects(
      rpc(first, "ops_practice_quote_decide", { ...payload, confirmed: false }),
      /Confirm/,
    );
    await assert.rejects(
      rpc(first, "ops_practice_quote_decide", {
        ...payload,
        request_version: 99,
      }),
      /changed/,
    );
    const accepted = await Promise.all([
      rpc(first, "ops_practice_quote_decide", payload),
      rpc(first, "ops_practice_quote_decide", payload),
    ]);
    assert.equal(accepted[0], accepted[1]);
    const decisions = (
      await pool().query(
        "select * from ops_quote_decisions where quote_id=$1",
        [quote],
      )
    ).rows;
    assert.equal(decisions.length, 1);
    assert.equal(decisions[0].actor_id, first);
    assert.equal(decisions[0].terms.total_minor, 3000);
    assert.equal((await snapshot(second, ca)).quotes.length, 0);
  });
  test("handoffs require accepted scope and physical lots; partial deliveries cannot complete the request", async () => {
    await core(analyst, "transition", {
      id: request,
      version: 3,
      stage: "Ready",
      notes: "Reviewed current accepted commercial and product terms.",
      handoff_reference: "",
      lot_reference: "",
      lot_expires_on: "",
    });
    const payload = {
      request_id: request,
      request_version: 4,
      quantity: 2,
      partner_reference: "PRIVATE-PARTNER",
      carrier: "Test carrier",
      tracking_reference: "TRACK-ONE",
      expected_on: future,
      notes: "Documented test partner handoff.",
    };
    await assert.rejects(
      op(analyst, "handoff", { ...payload, quantity: 3 }),
      /quantities exceed/,
    );
    shipment = await op(analyst, "handoff", payload);
    await assert.rejects(
      op(admin, "quote_status", {
        quote_id: quote,
        version: 3,
        status: "Withdrawn",
        notes: "Accepted terms cannot be withdrawn after handoff.",
      }),
      /after partner handoff/,
    );
    const progress = {
      shipment_id: shipment,
      version: 1,
      status: "Dispatched",
      occurred_on: today,
      practice_message: "The practice supply shipment was dispatched.",
      internal_notes: "PRIVATE routing details.",
    };
    await assert.rejects(op(analyst, "shipment", progress), /Allocate/);
    await op(analyst, "lot", {
      shipment_id: shipment,
      version: 1,
      lot_code: "LOT-A",
      expires_on: future,
      quantity: 1,
    });
    await assert.rejects(
      op(analyst, "lot", {
        shipment_id: shipment,
        version: 2,
        lot_code: "LOT-B",
        expires_on: future,
        quantity: 2,
      }),
      /Lot quantities exceed/,
    );
    await op(analyst, "lot", {
      shipment_id: shipment,
      version: 2,
      lot_code: "LOT-B",
      expires_on: future,
      quantity: 1,
    });
    await op(analyst, "shipment", { ...progress, version: 3 });
    await assert.rejects(
      op(analyst, "lot", {
        shipment_id: shipment,
        version: 4,
        lot_code: "LATE",
        expires_on: future,
        quantity: 1,
      }),
      /immutable/,
    );
    await assert.rejects(
      op(analyst, "complete", {
        request_id: request,
        request_version: 5,
        notes: "Incomplete delivery must not finish coordination.",
      }),
      /recorded delivery/,
    );
    await assert.rejects(
      op(analyst, "shipment", {
        ...progress,
        version: 4,
        status: "Delivered",
        occurred_on: "2000-01-01",
      }),
      /precede/,
    );
    await op(analyst, "shipment", {
      ...progress,
      version: 4,
      status: "Delivered",
      practice_message: "Delivery was recorded by the operations team.",
    });
    await op(analyst, "complete", {
      request_id: request,
      request_version: 5,
      notes: "All units delivered with traceability recorded.",
    });
    assert.equal((await row("ops_requests", request)).stage, "Completed");
    const view = await snapshot(first, ny);
    assert.equal(JSON.stringify(view).includes("PRIVATE"), false);
    assert.ok(
      view.shipments.some(
        (s: { tracking_reference: string }) =>
          s.tracking_reference === "TRACK-ONE",
      ),
    );
  });
  test("delivery exceptions hold coordination and block cancellation until a human resolves the follow-up", async () => {
    const flow = await readyShipment();
    await op(analyst, "shipment", {
      shipment_id: flow.shipment,
      version: 1,
      status: "Exception",
      occurred_on: today,
      practice_message: "A delivery exception needs operational follow-up.",
      internal_notes: "PRIVATE carrier escalation details.",
    });
    const r = await row("ops_requests", flow.request);
    assert.equal(r.stage, "Hold");
    await assert.rejects(
      rpc(first, "ops_practice_cancel", {
        request_id: r.id,
        version: r.version,
        reason: "A handoff exception cannot bypass cancellation controls.",
      }),
      /partner handoff/,
    );
    await assert.rejects(
      op(analyst, "resume", {
        request_id: r.id,
        request_version: r.version,
        notes: "Cannot resume with an open delivery exception.",
      }),
      /Resolve/,
    );
    const issue = (
      await pool().query("select * from ops_issues where request_id=$1", [r.id])
    ).rows[0];
    await op(analyst, "resolve_issue", {
      issue_id: issue.id,
      version: 1,
      resolution:
        "Carrier follow-up and corrective coordination were documented.",
      practice_message: "The operations team resolved the delivery follow-up.",
    });
    await op(analyst, "lot", {
      shipment_id: flow.shipment,
      version: 2,
      lot_code: "CLEAN-LOT",
      expires_on: future,
      quantity: 2,
    });
    await op(analyst, "resume", {
      request_id: r.id,
      request_version: r.version,
      notes: "Reviewed the resolution and resumed partner coordination.",
    });
    const view = await snapshot(first, ny);
    assert.equal(JSON.stringify(view).includes("PRIVATE"), false);
    assert.equal(
      view.requests.find((x: { id: string }) => x.id === r.id).cancellable,
      false,
    );
  });
  test("recall matching follows supplier and lot across practices and closure never releases recalled stock", async () => {
    const flow = await readyShipment(second, ca, offerCA);
    await op(analyst, "lot", {
      shipment_id: flow.shipment,
      version: 1,
      lot_code: "LOT-A",
      expires_on: future,
      quantity: 2,
    });
    const payload = {
      supplier_id: supplier,
      lot_code: "LOT-A",
      reference: "PRIVATE-RECALL-REF",
      source_url: "https://example.com/PRIVATE-recall",
      reason: "PRIVATE verified supplier recall follow-up context.",
      practice_message:
        "This supply lot needs a documented follow-up with Operations.",
    };
    await assert.rejects(op(analyst, "recall", payload), /Administrator/);
    recall = await op(admin, "recall", payload);
    const affected = (
      await pool().query("select * from ops_issues where recall_id=$1", [
        recall,
      ])
    ).rows;
    assert.equal(affected.length, 2);
    await assert.rejects(
      op(admin, "close_recall", {
        recall_id: recall,
        version: 1,
        resolution:
          "Cannot close while affected practices still need follow-up.",
      }),
      /every affected/,
    );
    assert.equal((await row("ops_requests", flow.request)).stage, "Hold");
    const a = await snapshot(first, ny),
      b = await snapshot(second, ca);
    assert.equal(
      a.issues.filter((i: { kind: string }) => i.kind === "Recall").length,
      1,
    );
    assert.equal(
      b.issues.filter((i: { kind: string }) => i.kind === "Recall").length,
      1,
    );
    assert.equal(JSON.stringify(a).includes("PRIVATE"), false);
    for (const issue of affected)
      await op(analyst, "resolve_issue", {
        issue_id: issue.id,
        version: 1,
        resolution:
          "Documented the affected practice follow-up and disposition.",
        practice_message:
          "Your practice supply follow-up has a recorded resolution.",
      });
    await op(admin, "close_recall", {
      recall_id: recall,
      version: 1,
      resolution:
        "All affected request follow-ups and disposition were documented.",
    });
    await assert.rejects(
      op(analyst, "shipment", {
        shipment_id: flow.shipment,
        version: 2,
        status: "Dispatched",
        occurred_on: today,
        practice_message:
          "A recalled lot must remain blocked after case closure.",
        internal_notes: "",
      }),
      /does not release stock/,
    );
  });
  test("internal channel quotes need administrator acceptance without granting consent for a practice",async()=>{
    await core(admin,"eligibility",{product_id:product,product_revision:1,state:"NY",channel:"Consumer",status:"Approved",evidence_url:"https://example.com/consumer-scope",valid_until:future,notes:"Documented internal channel review for this test."});
    const r=await core(analyst,"request",{practice_id:null,product_id:product,channel:"Consumer",state:"NY",quantity:1,needed_on:future,notes:"Internal channel planning request for this test."});
    const f=await op(analyst,"rfq",{request_id:r,request_version:1,reference:"INTERNAL-RFQ",due_on:future,notes:"Documented internal supplier contact record."});
    assert.equal((await row("ops_requests",r)).stage,"Review");
    const q=await draft(f);await op(admin,"quote_status",{quote_id:q,version:1,status:"Shared",notes:"Reviewed the internal channel quote and all charges."});
    await assert.rejects(op(analyst,"internal_accept",{quote_id:q,quote_version:2,request_version:2,confirmed:true,notes:"An analyst cannot approve internal commercial terms."}),/Administrator/);
    await op(admin,"internal_accept",{quote_id:q,quote_version:2,request_version:2,confirmed:true,notes:"Accepted the internal planning quote for coordination."});
    await op(analyst,"ready",{request_id:r,request_version:3,notes:"Current operating and commercial reviews are complete."});
    assert.equal((await row("ops_requests",r)).stage,"Ready");
  });
  test("declined terms remain in history and concurrent competing acceptances select only one quote",async()=>{
    const r=await createRequest(),f=await op(analyst,"rfq",{request_id:r,request_version:1,reference:"ALTERNATIVES-RFQ",due_on:future,notes:"Documented comparison of like-for-like source terms."});
    const declined=await draft(f);await op(admin,"quote_status",{quote_id:declined,version:1,status:"Shared",notes:"Reviewed the source reference and quoted charges."});
    await rpc(first,"ops_practice_quote_decide",{quote_id:declined,quote_version:2,request_version:2,decision:"Decline",confirmed:false,notes:"The practice declined these commercial terms."});
    assert.equal((await row("ops_quotes",declined)).status,"Declined");
    const alternatives=[await draft(f),await draft(f,{unit_minor:1300})];
    for(const q of alternatives)await op(admin,"quote_status",{quote_id:q,version:1,status:"Shared",notes:"Reviewed alternative pricing under the same request scope."});
    const outcomes=await Promise.allSettled(alternatives.map((q)=>rpc(first,"ops_practice_quote_decide",{quote_id:q,quote_version:2,request_version:2,decision:"Accept",confirmed:true,notes:"The practice selected this version of the quote."})));
    assert.equal(outcomes.filter((r)=>r.status==="fulfilled").length,1);
    assert.equal((await pool().query("select count(*) from ops_quote_decisions where request_id=$1 and decision='Accept'",[r])).rows[0].count,"1");
  });
  test("commerce tables, financial decisions and audit rows cannot be mutated directly by application users", async () => {
    for (const table of [
      "ops_rfqs",
      "ops_quotes",
      "ops_quote_decisions",
      "ops_shipments",
      "ops_shipment_lots",
      "ops_shipment_events",
      "ops_issues",
      "ops_recalls",
    ]) {
      await asUser(first, async (db) =>
        assert.equal((await db.query(`select * from ${table}`)).rowCount, 0),
      );
      await asUser(outsider, async (db) =>
        assert.equal((await db.query(`select * from ${table}`)).rowCount, 0),
      );
      await assert.rejects(
        asUser(admin, (db) => db.query(`delete from ${table}`)),
        /permission denied/,
      );
    }
    await assert.rejects(op(viewer, "rfq", {}), /Writer/);
    await assert.rejects(op(first, "recall", {}), /Writer/);
  });
}
