"use server";
import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/intelligence/auth";

export async function signIn(form: FormData) {
  const db = await serverSupabase();
  if (!db) redirect("/workspace/login?error=configuration");
  const email = String(form.get("email") || "")
      .trim()
      .slice(0, 254),
    password = String(form.get("password") || "");
  if (!email || !password || password.length > 1000)
    redirect("/workspace/login?error=credentials");
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) redirect("/workspace/login?error=credentials");
  redirect("/workspace/intelligence");
}

export async function signOut() {
  const db = await serverSupabase();
  await db?.auth.signOut();
  redirect("/workspace/login");
}
