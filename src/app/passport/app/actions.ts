"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authenticated } from "@/lib/passport/server";
import {
  schemas,
  kindSchema,
  idSchema,
  ownsPath,
  validUpload,
} from "@/lib/passport/validation";
function finish(ok: boolean): never {
  if (ok) revalidatePath("/passport/app");
  redirect(`/passport/app?message=${ok ? "saved" : "failed"}`);
}
export async function saveCredential(form: FormData) {
  const { db, user } = await authenticated();
  const kind = kindSchema.safeParse(form.get("kind"));
  if (!kind.success) finish(false);
  const parsed = schemas[kind.data].safeParse(Object.fromEntries(form));
  if (!parsed.success) finish(false);
  const id = form.get("id");
  if (id && !idSchema.safeParse(id).success) finish(false);
  const query = id
    ? db
        .from(`passport_${kind.data}`)
        .update(parsed.data)
        .eq("user_id", user.id)
        .eq("id", id)
    : db
        .from(`passport_${kind.data}`)
        .insert({ ...parsed.data, user_id: user.id });
  const { data, error } = await query.select("id");
  finish(!error && data?.length === 1);
}
export async function deleteCredential(form: FormData) {
  const { db, user } = await authenticated();
  const kind = kindSchema.safeParse(form.get("kind"));
  const id = idSchema.safeParse(form.get("id"));
  if (!kind.success || !id.success) finish(false);
  const { data, error } = await db
    .from(`passport_${kind.data}`)
    .delete()
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id");
  finish(!error && data?.length === 1);
}
export async function saveProfile(form: FormData) {
  const { db, user } = await authenticated();
  const name = String(form.get("display_name") || "").trim();
  if (!name || name.length > 120) finish(false);
  const { error } = await db
    .from("passport_profiles")
    .upsert({ user_id: user.id, display_name: name });
  finish(!error);
}
export async function uploadDocument(form: FormData) {
  const { db, user } = await authenticated();
  const file = form.get("file");
  if (!(file instanceof File) || file.size > 4194304 || !file.size)
    finish(false);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validUpload(bytes, file.type)) finish(false);
  const link = String(form.get("credential") || "");
  const links: Record<string, string> = {};
  if (link) {
    const [kind, id] = link.split(":");
    if (!kindSchema.safeParse(kind).success || !idSchema.safeParse(id).success)
      finish(false);
    const { data, error } = await db
      .from(`passport_${kind}`)
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    if (error || !data) finish(false);
    links[
      {
        licenses: "license_id",
        ce_entries: "ce_entry_id",
        certifications: "certification_id",
      }[kind]!
    ] = id;
  }
  const extensions: Record<string, string> = {
    "application/pdf": "pdf",
    "image/png": "png",
    "image/jpeg": "jpg",
  };
  const extension = extensions[file.type];
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await db.storage
    .from("passport-private")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (error) finish(false);
  const { error: metadataError } = await db.from("passport_documents").insert({
    user_id: user.id,
    storage_path: path,
    original_filename: file.name.replace(/[\x00-\x1f\x7f]/g, "").slice(0, 200),
    mime_type: file.type,
    bytes: file.size,
    ...links,
  });
  if (metadataError) {
    await db.storage.from("passport-private").remove([path]);
    finish(false);
  }
  finish(true);
}
export async function deleteDocument(form: FormData) {
  const { db, user } = await authenticated();
  const id = idSchema.safeParse(form.get("id"));
  if (!id.success) finish(false);
  const { data } = await db
    .from("passport_documents")
    .select("storage_path")
    .eq("id", id.data)
    .eq("user_id", user.id)
    .single();
  if (!data || !ownsPath(user.id, data.storage_path)) finish(false);
  const { error } = await db.storage
    .from("passport-private")
    .remove([data.storage_path]);
  if (error) finish(false);
  const { error: metadataError } = await db
    .from("passport_documents")
    .delete()
    .eq("id", id.data)
    .eq("user_id", user.id);
  finish(!metadataError);
}
