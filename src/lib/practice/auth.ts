import "server-only";
import { AccessError, serverSupabase } from "@/lib/intelligence/auth";
import type { PracticeLocation } from "./model";
export async function requirePracticeUser() {
  const db = await serverSupabase();
  if (!db) throw new AccessError(503, "Practice access is not configured yet.");
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user)
    throw new AccessError(401, "Sign in to access your practice.");
  const { data, error: membershipError } = await db.rpc("ops_practice_access");
  if (membershipError)
    throw new AccessError(
      503,
      "Practice access needs its database update. Contact your Siona administrator.",
    );
  const practices = data as PracticeLocation[];
  if (!practices.length)
    throw new AccessError(
      403,
      "Your account has not been linked to an active practice membership.",
    );
  return { db, user, practices };
}
