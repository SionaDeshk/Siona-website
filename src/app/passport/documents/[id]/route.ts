import { authenticated } from "@/lib/passport/server";
import { idSchema, ownsPath } from "@/lib/passport/validation";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { db, user } = await authenticated();
  const { id } = await params;
  if (!idSchema.safeParse(id).success)
    return new Response("Not found", { status: 404 });
  const { data } = await db
    .from("passport_documents")
    .select("storage_path,original_filename")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (!data || !ownsPath(user.id, data.storage_path))
    return new Response("Not found", { status: 404 });
  const { data: signed, error } = await db.storage
    .from("passport-private")
    .createSignedUrl(data.storage_path, 60, {
      download: data.original_filename,
    });
  if (error || !signed)
    return new Response("Download unavailable", { status: 503 });
  return new Response(null, {
    status: 303,
    headers: {
      Location: signed.signedUrl,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
