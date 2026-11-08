import {
  apiError,
  enforceOrigin,
  requireMember,
  AccessError,
} from "@/lib/intelligence/auth";
import { operationSchema } from "@/lib/intelligence/model";
import {
  approvedFeeds,
  ingestApprovedFeed,
} from "@/lib/intelligence/ingestion";
import {
  analyzeEvidence,
  configuredAnalysisProvider,
  type AnalysisEvidence,
} from "@/lib/intelligence/analysis";
import { readLimitedBody } from "@/lib/intelligence/body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const tables = [
  "signals",
  "sources",
  "opportunities",
  "evidence",
  "organizations",
  "contacts",
  "suppliers",
  "documents",
  "supplier_reviews",
  "categories",
  "links",
  "tasks",
  "notes",
  "evaluations",
  "weights",
  "decisions",
  "decision_evidence",
  "activity",
] as const;

export async function GET() {
  try {
    const { db, user, member } = await requireMember();
    const entries = await Promise.all(
      tables.map(async (name) => {
        let query = db.from(`intel_${name}`).select("*").limit(1000);
        if (name !== "weights")
          query = query.order(
            name === "activity" ? "occurred_at" : "created_at",
            { ascending: false },
          );
        const result = await query;
        if (result.error) throw result.error;
        return [name, result.data] as const;
      }),
    );
    const members = await db
      .from("intel_members")
      .select("user_id,display_name,role")
      .eq("active", true);
    if (members.error) throw members.error;
    return Response.json(
      {
        ...Object.fromEntries(entries),
        members: members.data,
        currentUser: user.id,
        currentRole: member.role,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    enforceOrigin(request);
    const { db, user, member } = await requireMember(true);
    if (
      request.headers.get("content-type")?.split(";")[0] !== "application/json"
    )
      throw new AccessError(415, "JSON is required.");
    let body: string;
    try {
      body = new TextDecoder().decode(await readLimitedBody(request, 64000));
    } catch {
      throw new AccessError(413, "Request too large.");
    }
    const parsed = operationSchema.safeParse(JSON.parse(body));
    if (!parsed.success)
      return Response.json(
        {
          error: parsed.error.issues
            .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
            .join("; "),
        },
        { status: 400 },
      );
    const op = parsed.data;
    let result: { error: unknown; data?: unknown } = { error: null };
    switch (op.operation) {
      case "signal":
      case "organization":
      case "contact":
      case "supplier":
      case "task":
      case "category":
      case "evidence": {
        const names = {
          signal: "signals",
          organization: "organizations",
          contact: "contacts",
          supplier: "suppliers",
          task: "tasks",
          category: "categories",
          evidence: "evidence",
        };
        const row: Record<string, unknown> = { ...op.data };
        result = await db
          .from(`intel_${names[op.operation]}`)
          .insert(row)
          .select("id")
          .single();
        break;
      }
      case "source":
        if (op.data.approved && member.role !== "admin")
          throw new AccessError(
            403,
            "Only administrators approve ingestion sources.",
          );
        if (
          op.data.adapter === "federal-register" &&
          op.data.url !== approvedFeeds["federal-register"]
        )
          throw new AccessError(
            400,
            "Use the exact approved Federal Register API URL in the setup documentation.",
          );
        result = await db.from("intel_sources").insert(op.data);
        break;
      case "update_supplier":
        result = await db
          .from("intel_suppliers")
          .update(op.data)
          .eq("id", op.id)
          .select("id")
          .single();
        break;
      case "review_signal":
        result = await db
          .from("intel_signals")
          .update({
            review_status: op.status,
            review_notes: op.notes,
            reviewed_by: user.id,
          })
          .eq("id", op.id)
          .select("id")
          .single();
        break;
      case "opportunity": {
        const { signal_ids, ...payload } = op.data;
        result = await db.rpc("intel_create_opportunity", {
          payload,
          signal_ids,
        });
        break;
      }
      case "decision": {
        const { signal_ids, ...payload } = op.data;
        result = await db.rpc("intel_record_decision", { payload, signal_ids });
        break;
      }
      case "supplier_stage":
        result = await db.rpc("intel_review_supplier", {
          target: op.id,
          next_stage: op.stage,
          rationale: op.rationale,
          gates: op.gates,
          human_reviewed: op.human_reviewed,
        });
        break;
      case "verify_document":
        result = await db
          .from("intel_documents")
          .update({
            verified_at: new Date().toISOString(),
            verified_by: user.id,
            verification_notes: op.notes,
          })
          .eq("id", op.id)
          .select("id")
          .single();
        break;
      case "task_status":
        if (op.status === "Completed" && op.result.trim().length < 10)
          throw new AccessError(
            400,
            "Record the validation outcome before completing the task.",
          );
        result = await db
          .from("intel_tasks")
          .update({ status: op.status, result: op.result })
          .eq("id", op.id)
          .select("id")
          .single();
        break;
      case "evaluation":
        result = await db.rpc("intel_save_evaluation", {
          target: op.data.opportunity_id,
          scores: op.data.scores,
        });
        break;
      case "weights":
        if (member.role !== "admin")
          throw new AccessError(
            403,
            "Only an administrator may change score weights.",
          );
        result = await db.rpc("intel_save_weights", { weights: op.weights });
        break;
      case "link": {
        const { operation: _operation, ...data } = op;
        void _operation;
        result = await db.from("intel_links").insert(data);
        break;
      }
      case "note": {
        const { operation: _operation, ...payload } = op;
        void _operation;
        result = await db.rpc("intel_log_relationship", { payload });
        break;
      }
      case "seed_demo":
        result = await db.rpc("intel_seed_demo");
        break;
      case "clear_demo":
        result = await db.rpc("intel_clear_demo");
        break;
      case "analyze": {
        const links = await db
          .from("intel_evidence")
          .select("signal_id")
          .eq("opportunity_id", op.opportunity_id);
        if (links.error) throw links.error;
        const ids = links.data.map((row) => row.signal_id);
        const evidence = ids.length
          ? await db
              .from("intel_signals")
              .select("id,title,summary,source_url,evidence_type")
              .in("id", ids)
              .limit(30)
          : { data: [], error: null };
        if (evidence.error) throw evidence.error;
        try {
          result = {
            error: null,
            data: await analyzeEvidence(
              evidence.data as AnalysisEvidence[],
              configuredAnalysisProvider(),
            ),
          };
        } catch {
          throw new AccessError(
            502,
            "AI analysis could not be validated. No records were changed. Continue with the manual workflow.",
          );
        }
        break;
      }
      case "ingest": {
        const source = await db
          .from("intel_sources")
          .select("*")
          .eq("id", op.source_id)
          .eq("approved", true)
          .single();
        if (source.error || !source.data)
          throw new AccessError(400, "Choose an approved source.");
        let imported;
        try {
          imported = await ingestApprovedFeed(
            source.data.adapter,
            source.data.url,
          );
        } catch {
          throw new AccessError(
            502,
            "The approved public feed could not be retrieved. Check its availability and environment network access; manual entry remains available.",
          );
        }
        if (imported.length) {
          result = await db.from("intel_signals").upsert(
            imported.map((row) => ({
              ...row,
              source_id: op.source_id,
              industry: "Regulatory",
              geography: "United States",
              evidence_type: "third_party_claim",
              reliability: "primary",
              reliability_notes:
                "Imported from a primary publisher; contents have not been reviewed by Siona.",
              why_matters: "Pending human assessment.",
              siona_relevance: "Pending human assessment.",
              confidence: "low",
            })),
            { onConflict: "source_url,title", ignoreDuplicates: true },
          );
          if (result.error) break;
        }
        result = await db
          .from("intel_sources")
          .update({ last_ingested_at: new Date().toISOString() })
          .eq("id", op.source_id);
        break;
      }
    }
    if (result.error) throw result.error;
    return Response.json(
      { ok: true, data: result.data ?? null },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return apiError(error);
  }
}
