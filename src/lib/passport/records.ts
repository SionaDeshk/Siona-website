import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
// Supabase defaults to 1,000 rows per response. Page explicitly so totals and
// exports never silently omit a clinician's older learning records.
export async function allRecords<
  T extends Record<string, unknown> = Record<string, string | number | null>,
>(db: SupabaseClient, table: string, userId: string) {
  const rows: T[] = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await db
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .order("id")
      .range(start, start + 499);
    if (error) return { data: null, error };
    rows.push(...data);
    if (data.length < 500) return { data: rows, error: null };
  }
}
