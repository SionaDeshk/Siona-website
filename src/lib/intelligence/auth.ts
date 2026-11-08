import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    if (
      !["https:", "http:"].includes(parsed.protocol) ||
      (process.env.NODE_ENV === "production" && parsed.protocol !== "https:")
    )
      return null;
  } catch {
    return null;
  }
  return { url, key };
}

export async function serverSupabase() {
  const config = supabaseConfig();
  if (!config) return null;
  const jar = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
    cookies: {
      getAll: () => jar.getAll(),
      setAll(values) {
        try {
          values.forEach(({ name, value, options }) =>
            jar.set(name, value, options),
          );
        } catch {
          /* Server Components cannot write cookies; proxy refreshes the session. */
        }
      },
    },
  });
}

export class AccessError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireMember(write = false) {
  const db = await serverSupabase();
  if (!db)
    throw new AccessError(
      503,
      "Supabase is not configured. Follow docs/evolution-engine.md to connect the existing project.",
    );
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user)
    throw new AccessError(401, "Sign in to access the internal workspace.");
  const { data: member, error: memberError } = await db
    .from("intel_members")
    .select("user_id,display_name,role,active")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();
  if (memberError)
    throw new AccessError(
      503,
      "The intelligence schema is unavailable. Apply the migration and provision workspace membership.",
    );
  if (!member)
    throw new AccessError(
      403,
      "Your account has not been granted Siona Intelligence access.",
    );
  if (write && !["admin", "analyst"].includes(member.role))
    throw new AccessError(403, "This account has read-only access.");
  return {
    db,
    user,
    member: member as {
      user_id: string;
      display_name: string;
      role: "admin" | "analyst" | "viewer";
    },
  };
}

export function enforceOrigin(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    throw new AccessError(403, "Same-origin requests are required.");
}

export function apiError(error: unknown) {
  if (error instanceof AccessError)
    return Response.json(
      { error: error.message },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  console.error("Intelligence request failed; no request contents logged.");
  return Response.json(
    {
      error:
        "The operation could not be completed. Check related records, qualification gates, and access permissions.",
    },
    { status: 400 },
  );
}
