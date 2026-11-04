import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = "/platform/profile";
  if (!code) return NextResponse.redirect(new URL("/platform/login?error=missing-code", url.origin));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !key) return NextResponse.redirect(new URL("/platform/login?error=configuration",url.origin));
  let response = NextResponse.redirect(new URL(next,url.origin));
  const client = createServerClient(supabaseUrl,key,{
    cookies: {
      getAll(){return request.cookies.getAll();},
      setAll(items){
        items.forEach(({name,value})=>request.cookies.set(name,value));
        response = NextResponse.redirect(new URL(next,url.origin));
        items.forEach(({name,value,options})=>response.cookies.set(name,value,options));
      }
    }
  });
  const {error}=await client.auth.exchangeCodeForSession(code);
  if(error) return NextResponse.redirect(new URL("/platform/login?error=verification",url.origin));
  return response;
}
