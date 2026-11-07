"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { configured, supabase } from "@/lib/passport/server";
export async function login(form: FormData) {
  if (!configured()) redirect("/passport/login?message=configuration");
  const parsed = z
    .object({
      email: z.email(),
      password: z.string().min(8).max(128),
      mode: z.enum(["login", "signup"]),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/passport/login?message=invalid");
  const db = await supabase();
  const { email, password, mode } = parsed.data;
  const { error } =
    mode === "signup"
      ? await db.auth.signUp({
          email,
          password,
          options: process.env.NEXT_PUBLIC_SITE_URL
            ? {
                emailRedirectTo: new URL(
                  "/passport/auth/callback",
                  process.env.NEXT_PUBLIC_SITE_URL,
                ).toString(),
              }
            : undefined,
        })
      : await db.auth.signInWithPassword({ email, password });
  if (error) redirect("/passport/login?message=failed");
  if (mode === "signup") redirect("/passport/login?message=confirm");
  redirect("/passport/app");
}
export async function logout() {
  const db = await supabase();
  await db.auth.signOut();
  redirect("/passport/login");
}
