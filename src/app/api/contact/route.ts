import { createContactHandlers } from "@/lib/server/contact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Keep one instance per process for the development-only memory limiter.
const handlers = createContactHandlers({
  production: process.env.NODE_ENV === "production",
  secret: process.env.CONTACT_SECURITY_SECRET,
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.CONTACT_FROM_EMAIL,
  to: process.env.CONTACT_TO_EMAIL,
  redisUrl: process.env.UPSTASH_REDIS_REST_URL,
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
