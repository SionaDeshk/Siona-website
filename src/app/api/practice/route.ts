import { z } from "zod";
import { AccessError, enforceOrigin } from "@/lib/intelligence/auth";
import { readLimitedBody } from "@/lib/intelligence/body";
import { requirePracticeUser } from "@/lib/practice/auth";
import { practiceOperationSchema } from "@/lib/practice/model";
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
  if ((error as { code?: string })?.code === "P0001")
    return Response.json(
      { error: (error as { message: string }).message },
      { status: 409, headers },
    );
  return Response.json(
    {
      error:
        "This request could not be completed. Refresh and check your practice access and request details.",
    },
    { status: 400, headers },
  );
}
export async function GET(request: Request) {
  try {
    const { db } = await requirePracticeUser();
    const selected = new URL(request.url).searchParams.get("practice_id");
    if (selected && !z.uuid().safeParse(selected).success)
      throw new AccessError(400, "Choose a valid practice.");
    const { data, error } = await db.rpc("ops_practice_snapshot", {
      target_practice: selected || null,
    });
    if (error) throw error;
    return Response.json(data, { headers });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    enforceOrigin(request);
    const { db } = await requirePracticeUser();
    if (
      request.headers.get("content-type")?.split(";")[0] !== "application/json"
    )
      throw new AccessError(415, "JSON is required.");
    let bytes: Uint8Array;
    try {
      bytes = await readLimitedBody(request, 4000);
    } catch {
      throw new AccessError(413, "Request too large.");
    }
    let body: unknown;
    try {
      body = JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      throw new AccessError(400, "Valid JSON is required.");
    }
    const parsed = practiceOperationSchema.safeParse(body);
    if (!parsed.success)
      throw new AccessError(
        400,
        parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      );
    const { action, ...payload } = parsed.data;
    const { data, error } = await db.rpc(
      action === "submit" ? "ops_practice_submit" : "ops_practice_cancel",
      { payload },
    );
    if (error) throw error;
    return Response.json({ id: data }, { headers });
  } catch (error) {
    return failure(error);
  }
}
