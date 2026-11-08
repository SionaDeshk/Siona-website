import { NextResponse, type NextRequest } from "next/server";
import { callbackDestination } from "@/lib/passport/auth-validation";
import { configured, supabase } from "@/lib/passport/server";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code && configured()) {
    const db = await supabase();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(
          callbackDestination(request.nextUrl.searchParams.get("next")),
          request.url,
        ),
      );
  }
  return NextResponse.redirect(
    new URL("/passport/login?message=failed", request.url),
  );
}
