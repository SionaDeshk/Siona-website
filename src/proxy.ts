import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next({request});
  let response = NextResponse.next({request});
  const supabase = createServerClient(url,key,{
    cookies:{
      getAll(){return request.cookies.getAll();},
      setAll(items: {name:string;value:string;options?:import("@supabase/ssr").CookieOptions}[]){
        items.forEach(({name,value})=>request.cookies.set(name,value));
        response=NextResponse.next({request});
        items.forEach(({name,value,options})=>response.cookies.set(name,value,options));
      }
    }
  });
  // Refresh expired access tokens before protected server components render.
  // Never rely on getSession() to authorize access.
  await supabase.auth.getUser();
  return response;
}

export const config={matcher:["/platform/profile/:path*","/platform/recruiter/:path*"]};
