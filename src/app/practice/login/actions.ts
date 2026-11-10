"use server";
import { redirect } from "next/navigation";
import { signIn } from "@/app/workspace/login/actions";
import { serverSupabase } from "@/lib/intelligence/auth";
export async function practiceSignIn(form: FormData) {
  form.set("destination", "practice");
  return signIn(form);
}
export async function practiceSignOut() {
  const db = await serverSupabase();
  await db?.auth.signOut();
  redirect("/practice/login");
}
