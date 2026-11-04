import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function supabaseServer() {
  const store = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase configuration is missing.");
  return createServerClient(url, key, {
    cookies: {
      getAll() { return store.getAll(); },
      setAll(items) {
        try { items.forEach(({name,value,options}) => store.set(name,value,options)); }
        catch { /* Server Component renders cannot set cookies. */ }
      }
    }
  });
}
