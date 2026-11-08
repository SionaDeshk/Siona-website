"use server";
import { configured, supabase } from "@/lib/passport/server";
import {
  recoveryCallback,
  recoveryEmailSchema,
} from "@/lib/passport/auth-validation";
export type RecoveryState = { error?: string; sent?: boolean };
export async function requestRecovery(
  _previous: RecoveryState,
  form: FormData,
): Promise<RecoveryState> {
  const email = recoveryEmailSchema.safeParse(form.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };
  const callback = recoveryCallback(process.env.NEXT_PUBLIC_SITE_URL);
  if (!configured() || !callback)
    return {
      error:
        "Password recovery is awaiting configuration. Please try again later.",
    };
  try {
    const db = await supabase();
    // Deliberately use the same response for existing/nonexistent accounts and
    // provider rejections, including rate limits. Never reveal account existence.
    await db.auth.resetPasswordForEmail(email.data, { redirectTo: callback });
    return { sent: true };
  } catch {
    return { error: "We couldn’t connect. Please try again later." };
  }
}
