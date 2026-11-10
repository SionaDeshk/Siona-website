import {
  AccessError,
  enforceOrigin,
  requireMember,
} from "@/lib/intelligence/auth";
import { readLimitedBody } from "@/lib/intelligence/body";
import { commerceOperationSchema } from "@/lib/commerce/model";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};
function failure(error: unknown) {
  if (error instanceof AccessError)
    return Response.json(
      { error: error.message },
      { status: error.status, headers },
    );
  const e = error as { code?: string; message?: string };
  if (["PGRST205", "PGRST202", "42P01", "42703"].includes(e?.code || ""))
    return Response.json(
      {
        error:
          "Quotes and fulfillment need their additional database migration. Your existing Operations workspace is available.",
        setupRequired: true,
      },
      { status: 503, headers },
    );
  if (e?.code === "P0001")
    return Response.json({ error: e.message }, { status: 409, headers });
  if (e?.code === "23505")
    return Response.json(
      {
        error: "A matching record already exists. Refresh before trying again.",
      },
      { status: 409, headers },
    );
  return Response.json(
    {
      error:
        "The operation could not be completed. Check the record details, current reviews and your permissions.",
    },
    { status: 400, headers },
  );
}
export async function GET() {
  try {
    const { db } = await requireMember();
    const names = {
      rfqs: "ops_rfqs",
      quotes: "ops_quotes",
      shipments: "ops_shipments",
      lots: "ops_shipment_lots",
      shipment_events: "ops_shipment_events",
      recalls: "ops_recalls",
      issues: "ops_issues",
      requests: "ops_requests",
    };
    const entries = await Promise.all(
      Object.entries(names).map(async ([name, table]) => {
        const { data, error } = await db
          .from(table)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(501);
        if (error) throw error;
        return [name, data] as const;
      }),
    );
    return Response.json(
      {
        ...Object.fromEntries(
          entries.map(([name, rows]) => [name, rows.slice(0, 500)]),
        ),
        truncated: entries.some(([, rows]) => rows.length > 500),
      },
      { headers },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    enforceOrigin(request);
    const { db, member } = await requireMember(true);
    if (
      request.headers.get("content-type")?.split(";")[0] !== "application/json"
    )
      throw new AccessError(415, "JSON is required.");
    let bytes: Uint8Array;
    try {
      bytes = await readLimitedBody(request, 12000);
    } catch {
      throw new AccessError(413, "Request too large.");
    }
    let raw: unknown;
    try {
      raw = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      throw new AccessError(400, "Valid JSON is required.");
    }
    const parsed = commerceOperationSchema.safeParse(raw);
    if (!parsed.success)
      throw new AccessError(
        400,
        parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      );
    const { action, ...payload } = parsed.data;
    if (
      ["quote_status", "internal_accept", "recall", "close_recall"].includes(
        action,
      ) &&
      member.role !== "admin"
    )
      throw new AccessError(403, "Administrator review is required.");
    const { data, error } = await db.rpc("ops_commerce_save", {
      action,
      payload,
    });
    if (error) throw error;
    return Response.json({ id: data }, { headers });
  } catch (error) {
    return failure(error);
  }
}
