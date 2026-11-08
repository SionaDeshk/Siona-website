"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  credentialFields,
  formValues,
  validationErrors,
  type FormState,
} from "@/lib/passport/form-state";
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
export async function saveCredential(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const { db, user } = await authenticated();
  const kind = kindSchema.safeParse(form.get("kind"));
  if (!kind.success)
    return { error: "Unknown credential type. Refresh and try again." };
  const values = formValues(form, credentialFields[kind.data]);
  const state = { key: crypto.randomUUID(), values };
  const parsed = schemas[kind.data].safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      ...state,
      fieldErrors: validationErrors(parsed.error),
      error: "Please correct the highlighted fields.",
    };
  const id = form.get("id");
  if (id && !idSchema.safeParse(id).success)
    return {
      ...state,
      error: "This record could not be identified. Refresh and try again.",
    };
  try {
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
    if (error || data?.length !== 1)
      return {
        ...state,
        error:
          "We couldn’t save this record. Your entries are still here; try again.",
      };
  } catch {
    return {
      ...state,
      error: "We couldn’t connect. Your entries are still here; try again.",
    };
  }
  revalidatePath("/passport/app");
  return {
    ...state,
    values: id
      ? values
      : Object.fromEntries(
          credentialFields[kind.data].map((field) => [
            field,
            field === "license_type"
              ? "RN"
              : field === "status"
                ? "self_reported"
                : "",
          ]),
        ),
    success: true,
  };
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
export async function saveProfile(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const { db, user } = await authenticated();
  const values = formValues(form, ["display_name"]);
  const state = { key: crypto.randomUUID(), values };
  const name = values.display_name.trim();
  if (!name || name.length > 120)
    return {
      ...state,
      fieldErrors: {
        display_name: "Enter a display name of 1–120 characters.",
      },
    };
  try {
    const { error } = await db
      .from("passport_profiles")
      .upsert({ user_id: user.id, display_name: name });
    if (error)
      return {
        ...state,
        error:
          "We couldn’t save your profile. Your entry is still here; try again.",
      };
  } catch {
    return {
      ...state,
      error: "We couldn’t connect. Your entry is still here; try again.",
    };
  }
  revalidatePath("/passport/app");
  return { ...state, values: { display_name: name }, success: true };
}
export async function uploadDocument(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const { db, user } = await authenticated();
  const values = formValues(form, ["credential"]);
  const state = { key: crypto.randomUUID(), values };
  const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > 4194304)
    return {
      ...state,
      fieldErrors: { file: "Choose a PDF, PNG, or JPEG file up to 4 MB." },
    };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validUpload(bytes, file.type))
    return {
      ...state,
      fieldErrors: {
        file: "This file does not match a supported PDF, PNG, or JPEG format.",
      },
    };
  const links: Record<string, string> = {};
  const link = values.credential;
  if (link) {
    const parts = link.split(":");
    const [kind, id] = parts;
    if (
      parts.length !== 2 ||
      !kindSchema.safeParse(kind).success ||
      !idSchema.safeParse(id).success
    )
      return {
        ...state,
        fieldErrors: {
          credential: "Choose an available credential or no linked credential.",
        },
      };
    try {
      const { data, error } = await db
        .from(`passport_${kind}`)
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();
      if (error || !data)
        return {
          ...state,
          fieldErrors: {
            credential:
              "That credential is no longer available. Choose another or no linked credential.",
          },
        };
    } catch {
      return {
        ...state,
        error: "We couldn’t check the credential. Try again.",
      };
    }
    links[
      {
        licenses: "license_id",
        ce_entries: "ce_entry_id",
        certifications: "certification_id",
      }[kind]!
    ] = id;
  }
  const extension = (
    {
      "application/pdf": "pdf",
      "image/png": "png",
      "image/jpeg": "jpg",
    } as Record<string, string>
  )[file.type];
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  try {
    const { error } = await db.storage
      .from("passport-private")
      .upload(path, bytes, { contentType: file.type, upsert: false });
    if (error)
      return {
        ...state,
        error:
          "We couldn’t upload this file. Your selection is still here; try again.",
      };
    const { error: metadataError } = await db
      .from("passport_documents")
      .insert({
        user_id: user.id,
        storage_path: path,
        original_filename: file.name
          .replace(/[\x00-\x1f\x7f]/g, "")
          .slice(0, 200),
        mime_type: file.type,
        bytes: file.size,
        ...links,
      });
    if (metadataError) {
      const { error: cleanupError } = await db.storage
        .from("passport-private")
        .remove([path]);
      return {
        ...state,
        error: cleanupError
          ? "The upload could not be saved and its cleanup needs attention. Contact support before retrying."
          : "We couldn’t save this document. The uploaded file was removed; try again.",
      };
    }
  } catch {
    return {
      ...state,
      error:
        "The upload was interrupted. Refresh your vault before retrying to avoid duplicates.",
    };
  }
  revalidatePath("/passport/app");
  return { ...state, values: { credential: "" }, success: true };
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
