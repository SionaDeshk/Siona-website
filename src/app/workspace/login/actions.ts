"use server";
import { redirect } from "next/navigation";
import { serverSupabase } from "@/lib/intelligence/auth";
import {
  devicePreviewPath,
  isDevicePreviewDestination,
} from "@/lib/intelligence/device-preview";

export async function signIn(form: FormData) {
  const practice = form.get("destination") === "practice";
  const devicePreview = isDevicePreviewDestination(
    form.get("destination"),
    process.env.NODE_ENV,
    process.env.VERCEL_ENV,
  );
  const loginPath = practice
    ? "/practice/login"
    : devicePreview
      ? "/workspace/login?preview=device-information"
      : "/workspace/login";
  const failurePath = (error: string) =>
    `${loginPath}${devicePreview ? "&" : "?"}error=${error}`;
  const db = await serverSupabase();
  if (!db) redirect(failurePath("configuration"));
  const email = String(form.get("email") || "")
      .trim()
      .slice(0, 254),
    password = String(form.get("password") || "");
  if (!email || !password || password.length > 1000)
    redirect(failurePath("credentials"));
  const {
    data: { user },
    error,
  } = await db.auth.signInWithPassword({ email, password });
  if (error || !user) redirect(failurePath("credentials"));
  if (devicePreview) redirect(devicePreviewPath);
  if (practice) {
    const access = await db.rpc("ops_practice_access");
    if (access.error || !access.data?.length)
      redirect(`${loginPath}?error=access`);
    redirect("/practice");
  }
  const internal = await db
    .from("intel_members")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  if (!internal.data && !internal.error) {
    const access = await db.rpc("ops_practice_access");
    if (!access.error && access.data?.length) redirect("/practice");
  }
  redirect("/workspace/intelligence");
}

export async function signOut() {
  const db = await serverSupabase();
  await db?.auth.signOut();
  redirect("/workspace/login");
}
