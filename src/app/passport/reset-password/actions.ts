"use server";
import { redirect } from "next/navigation";
import { authenticated } from "@/lib/passport/server";
import { newPasswordSchema } from "@/lib/passport/auth-validation";
export type PasswordState = { error?: string };
export async function changePassword(
  _previous: PasswordState,
  form: FormData,
): Promise<PasswordState> {
  const { db } = await authenticated();
  const parsed = newPasswordSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    return {
      error: "Use 8–128 characters and make sure both passwords match.",
    };
  try {
    const { error } = await db.auth.updateUser({
      password: parsed.data.password,
    });
    if (error)
      return {
        error:
          "Unable to change your password. Request a new reset link and try again. Your project may require recent authentication or a stronger password.",
      };
  } catch {
    return { error: "We couldn’t connect. Please try again." };
  }
  redirect("/passport/app?message=password-updated");
}
