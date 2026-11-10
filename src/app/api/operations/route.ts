import {
  AccessError,
  enforceOrigin,
  requireMember,
} from "@/lib/intelligence/auth";
import { readLimitedBody } from "@/lib/intelligence/body";
import { operationSchema } from "@/lib/operations/model";

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
  const code = (error as { code?: string })?.code;
  if (code === "PGRST205" || code === "PGRST202" || code === "42P01")
    return Response.json(
      {
        error:
          "Operations needs its additional database migration. Your existing Evo records are unchanged.",
        setupRequired: true,
      },
      { status: 503, headers },
    );
  if (code === "P0001")
    return Response.json(
      { error: (error as { message: string }).message },
      { status: 409, headers },
    );
  if (code === "23505")
    return Response.json(
      {
        error:
          "A matching record already exists. Refresh to edit the existing entry.",
      },
      { status: 409, headers },
    );
  return Response.json(
    {
      error:
        "The operation could not be completed. Refresh and check the record details and your access.",
    },
    { status: 400, headers },
  );
}
export async function GET() {
  try {
    const { db, member } = await requireMember();
    const entries = await Promise.all(
      ["practices", "products", "eligibility", "requests", "events"].map(
        async (name) => {
          const { data, error } = await db
            .from(`ops_${name}`)
            .select("*")
            .order("created_at", { ascending: false })
            .limit(501);
          if (error) throw error;
          return [name, data] as const;
        },
      ),
    );
    const [suppliers, organizations] = await Promise.all([
      db
        .from("intel_suppliers")
        .select("id,organization_id,stage,verification,demo_batch_id")
        .limit(501),
      db.from("intel_organizations").select("id,legal_name").limit(501),
    ]);
    if (suppliers.error) throw suppliers.error;
    if (organizations.error) throw organizations.error;
    const portal = await Promise.all([
      db
        .from("ops_practice_offers")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(501),
      db
        .from("ops_practice_updates")
        .select("id,request_id,body,created_at")
        .order("created_at", { ascending: false })
        .limit(501),
    ]);
    const portalReady = portal.every((r) => !r.error);
    for (const result of portal)
      if (result.error && !["PGRST205", "42P01"].includes(result.error.code))
        throw result.error;
    let access: unknown[] = [];
    if (portalReady && member.role === "admin") {
      const result = await db.rpc("ops_list_practice_access");
      if (result.error) throw result.error;
      access = result.data;
    }
    const all = [
      ...entries,
      ["suppliers", suppliers.data] as const,
      ["organizations", organizations.data] as const,
    ];
    return Response.json(
      {
        ...Object.fromEntries(all.map(([k, rows]) => [k, rows.slice(0, 500)])),
        truncated:
          all.some(([, rows]) => rows.length > 500) ||
          portal.some((r) => (r.data?.length || 0) > 500),
        portal_ready: portalReady,
        practice_access: access,
        practice_offers: portalReady ? portal[0].data?.slice(0, 500) : [],
        practice_updates: portalReady ? portal[1].data?.slice(0, 500) : [],
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
    let raw: Uint8Array;
    try {
      raw = await readLimitedBody(request, 16000);
    } catch {
      throw new AccessError(413, "Request too large.");
    }
    let body: unknown;
    try {
      body = JSON.parse(new TextDecoder().decode(raw));
    } catch {
      throw new AccessError(400, "Valid JSON is required.");
    }
    const parsed = operationSchema.safeParse(body);
    if (!parsed.success)
      return Response.json(
        {
          error: parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        { status: 400, headers },
      );
    const { action, ...payload } = parsed.data;
    if (
      [
        "practice_review",
        "eligibility",
        "practice_access",
        "practice_offer",
      ].includes(action) &&
      member.role !== "admin"
    )
      throw new AccessError(403, "An administrator must record this review.");
    const rpc = {
      practice_access: "ops_manage_practice_access",
      practice_offer: "ops_publish_practice_offer",
      practice_update: "ops_post_practice_update",
    };
    const portalAction = action in rpc;
    const { data, error } = await db.rpc(
      portalAction ? rpc[action as keyof typeof rpc] : "ops_save",
      portalAction ? { payload } : { action, payload },
    );
    if (error) throw error;
    return Response.json({ id: data }, { headers });
  } catch (error) {
    return failure(error);
  }
}
