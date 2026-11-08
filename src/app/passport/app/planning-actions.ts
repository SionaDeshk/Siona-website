"use server";
import { revalidatePath } from "next/cache";
import { authenticated } from "@/lib/passport/server";
import { idSchema } from "@/lib/passport/validation";
import {
  formValues,
  validationErrors,
  type FormState,
} from "@/lib/passport/form-state";
import {
  goalSchema,
  renewalSchema,
  planningFields,
  planningKind,
} from "@/lib/passport/planning";
export async function savePlanning(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const { db, user } = await authenticated();
  const kind = planningKind.safeParse(form.get("kind"));
  if (!kind.success) return { error: "Unknown planning record." };
  const values = formValues(form, planningFields[kind.data]);
  const state = { key: crypto.randomUUID(), values };
  const parsed = (
    kind.data === "ce_goals" ? goalSchema : renewalSchema
  ).safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      ...state,
      error: "Please correct the highlighted fields.",
      fieldErrors: validationErrors(parsed.error),
    };
  const id = form.get("id");
  if (id && !idSchema.safeParse(id).success)
    return { ...state, error: "This record could not be identified." };
  const data: Record<string, unknown> = { ...parsed.data };
  try {
    if ("credential" in parsed.data) {
      const [credentialKind, credentialId] = parsed.data.credential.split(":");
      if (!idSchema.safeParse(credentialId).success)
        return {
          ...state,
          fieldErrors: { credential: "Choose an available credential." },
        };
      const { data: credential, error } = await db
        .from(`passport_${credentialKind}`)
        .select("id")
        .eq("id", credentialId)
        .eq("user_id", user.id)
        .single();
      if (error || !credential)
        return {
          ...state,
          fieldErrors: {
            credential: "That credential is no longer available.",
          },
        };
      delete data.credential;
      data.license_id = credentialKind === "licenses" ? credentialId : null;
      data.certification_id =
        credentialKind === "certifications" ? credentialId : null;
    }
    const query = id
      ? db
          .from(`passport_${kind.data}`)
          .update(data)
          .eq("id", id)
          .eq("user_id", user.id)
      : db.from(`passport_${kind.data}`).insert({ ...data, user_id: user.id });
    const { data: saved, error } = await query.select("id");
    if (error || saved?.length !== 1)
      return {
        ...state,
        error:
          "We couldn’t save this plan. Your entries are still here. Verify planning setup and try again.",
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
    success: true,
    values: id
      ? values
      : Object.fromEntries(
          planningFields[kind.data].map((field) => [
            field,
            field === "currency" ? "USD" : "",
          ]),
        ),
  };
}
export async function removePlanning(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const { db, user } = await authenticated();
  const kind = planningKind.safeParse(form.get("kind")),
    id = idSchema.safeParse(form.get("id"));
  if (!kind.success || !id.success)
    return { error: "This planning record could not be identified." };
  try {
    const { data, error } = await db
      .from(`passport_${kind.data}`)
      .delete()
      .eq("id", id.data)
      .eq("user_id", user.id)
      .select("id");
    if (error || data?.length !== 1)
      return { error: "Unable to delete this planning record. Try again." };
  } catch {
    return { error: "We couldn’t connect. Try again." };
  }
  revalidatePath("/passport/app");
  return { success: true };
}
export async function setTaskCompleted(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const { db, user } = await authenticated();
  const id = idSchema.safeParse(form.get("id")),
    completed = form.get("completed");
  if (!id.success || !["true", "false"].includes(String(completed)))
    return { error: "Invalid task." };
  try {
    const { data, error } = await db
      .from("passport_renewal_tasks")
      .update({ completed: completed === "true" })
      .eq("id", id.data)
      .eq("user_id", user.id)
      .select("id");
    if (error || data?.length !== 1)
      return { error: "We couldn’t update this task. Try again." };
  } catch {
    return { error: "We couldn’t connect. Try again." };
  }
  revalidatePath("/passport/app");
  return { success: true };
}
