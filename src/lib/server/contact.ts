import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { contactSchema } from "../contact-schema";

export type ContactConfig = {
  production: boolean;
  secret?: string;
  apiKey?: string;
  from?: string;
  to?: string;
  redisUrl?: string;
  redisToken?: string;
  siteUrl?: string;
};

const MIN_AGE = 2000;
const MAX_AGE = 60 * 60 * 1000;
const BODY_LIMIT = 24_000;
const CLIENT_WINDOW = 15 * 60;
const CLIENT_LIMIT = 5;
const GLOBAL_WINDOW = 60 * 60;
const GLOBAL_LIMIT = 100;
const submissionSchema = contactSchema.extend({
  website: z.string().max(200).optional().default(""),
  token: z.string().min(1).max(500),
}).strict();

type Token = { id: string; issued: number };
type Bucket = { count: number; expires: number };
type LimiterResult = "allowed" | "limited" | "duplicate";

// A single Redis script makes quota checks, increments, and replay protection atomic.
const LIMIT_SCRIPT = `
if redis.call('EXISTS', KEYS[3]) == 1 then return 2 end
if tonumber(redis.call('GET', KEYS[1]) or '0') >= tonumber(ARGV[1]) then return 0 end
if tonumber(redis.call('GET', KEYS[2]) or '0') >= tonumber(ARGV[3]) then return 0 end
local client = redis.call('INCR', KEYS[1])
if client == 1 then redis.call('EXPIRE', KEYS[1], ARGV[2]) end
local total = redis.call('INCR', KEYS[2])
if total == 1 then redis.call('EXPIRE', KEYS[2], ARGV[4]) end
redis.call('SET', KEYS[3], '1', 'EX', ARGV[5])
return 1`;

export function createContactHandlers(
  config: ContactConfig,
  fetcher: typeof fetch = fetch,
  now: () => number = Date.now,
) {
  // This fallback is for local development only. Production always uses Redis.
  const localBuckets = new Map<string, Bucket>();
  const usedTokens = new Map<string, number>();
  const secret = config.secret || (!config.production ? "siona-local-development-only-secret" : "");

  function digest(value: string) {
    return createHmac("sha256", secret).update(value).digest("base64url");
  }

  function reply(status: number, message: string, extraHeaders?: HeadersInit) {
    return Response.json({ message }, {
      status,
      headers: { "Cache-Control": "no-store", ...extraHeaders },
    });
  }

  function verifyToken(value: string): Token | undefined {
    const parts = value.split(".");
    if (parts.length !== 2) return;
    const [payload, signature] = parts;
    const expected = Buffer.from(digest(payload));
    const supplied = Buffer.from(signature);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return;
    try {
      const data: unknown = JSON.parse(Buffer.from(payload, "base64url").toString());
      const parsed = z.object({ id: z.uuid(), issued: z.number().int() }).safeParse(data);
      if (!parsed.success) return;
      const age = now() - parsed.data.issued;
      if (age < MIN_AGE || age > MAX_AGE) return;
      return parsed.data;
    } catch { return; }
  }

  async function rateLimit(ip: string, token: Token): Promise<LimiterResult> {
    const clientKey = `siona:contact:client:${digest(ip)}`;
    const globalKey = "siona:contact:global";
    const tokenKey = `siona:contact:token:${token.id}`;

    if (config.redisUrl && config.redisToken) {
      const url = new URL(config.redisUrl);
      if (url.protocol !== "https:") throw new Error("Redis requires HTTPS");
      const result = await fetcher(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${config.redisToken}`, "Content-Type": "application/json" },
        body: JSON.stringify([
          "EVAL", LIMIT_SCRIPT, "3", clientKey, globalKey, tokenKey,
          String(CLIENT_LIMIT), String(CLIENT_WINDOW), String(GLOBAL_LIMIT), String(GLOBAL_WINDOW), String(MAX_AGE / 1000),
        ]),
        signal: AbortSignal.timeout(5000),
        cache: "no-store",
      });
      if (!result.ok) throw new Error("Rate limiter unavailable");
      const body: { result?: number; error?: string } = await result.json();
      if (body.error || ![0, 1, 2].includes(body.result as number)) throw new Error("Invalid rate limiter response");
      return body.result === 1 ? "allowed" : body.result === 2 ? "duplicate" : "limited";
    }

    if (config.production) throw new Error("Production requires a shared rate limiter");
    const time = now();
    for (const [key, bucket] of localBuckets) if (bucket.expires <= time) localBuckets.delete(key);
    for (const [key, expiry] of usedTokens) if (expiry <= time) usedTokens.delete(key);
    if (usedTokens.has(token.id)) return "duplicate";
    const client = localBuckets.get(clientKey) ?? { count: 0, expires: time + CLIENT_WINDOW * 1000 };
    const global = localBuckets.get(globalKey) ?? { count: 0, expires: time + GLOBAL_WINDOW * 1000 };
    if (client.count >= CLIENT_LIMIT || global.count >= GLOBAL_LIMIT) return "limited";
    client.count++;
    global.count++;
    localBuckets.set(clientKey, client);
    localBuckets.set(globalKey, global);
    usedTokens.set(token.id, time + MAX_AGE);
    return "allowed";
  }

  async function GET() {
    if (secret.length < 32) return reply(503, "Contact is temporarily unavailable. Please try again shortly.");
    const issued = now();
    const payload = Buffer.from(JSON.stringify({ id: randomUUID(), issued })).toString("base64url");
    return Response.json({ token: `${payload}.${digest(payload)}`, readyAt: issued + MIN_AGE }, { headers: { "Cache-Control": "no-store" } });
  }

  async function POST(request: Request) {
    // Require a browser same-origin POST; never trust an arbitrary forwarded host.
    const origin = request.headers.get("origin");
    const allowedOrigins = new Set([new URL(request.url).origin]);
    if (config.siteUrl) {
      try { allowedOrigins.add(new URL(config.siteUrl).origin); } catch { /* Invalid optional URL does not add an origin. */ }
    }
    if (!origin || !allowedOrigins.has(origin)) return reply(403, "Please send your message using the form on this website.");
    if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return reply(415, "Please send a valid form submission.");

    let input: unknown;
    try {
      if (Number(request.headers.get("content-length")) > BODY_LIMIT) return reply(413, "Your message is too long.");
      const reader = request.body?.getReader();
      if (!reader) return reply(400, "Please complete the form.");
      const decoder = new TextDecoder();
      let size = 0;
      let body = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > BODY_LIMIT) { await reader.cancel(); return reply(413, "Your message is too long."); }
        body += decoder.decode(value, { stream: true });
      }
      body += decoder.decode();
      input = JSON.parse(body);
    } catch { return reply(400, "Please send a valid form submission."); }

    const parsed = submissionSchema.safeParse(input);
    if (!parsed.success) return reply(400, "Please check your name, email, and message, then try again.");
    // Quietly discard the honeypot without contacting the mail provider.
    if (parsed.data.website) return reply(200, "Your message has been sent.");
    if (secret.length < 32) return reply(503, "Contact is temporarily unavailable. Please try again shortly.");
    const token = verifyToken(parsed.data.token);
    if (!token) return reply(400, "This form has expired or was submitted too quickly. Please try again.");
    if (!config.apiKey || !z.email().safeParse(config.from).success || !z.email().safeParse(config.to).success) {
      return reply(503, "Contact is temporarily unavailable. Please try again shortly.");
    }

    try {
      // Vercel overwrites x-forwarded-for. Other hosts must use a trusted reverse proxy.
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
      const result = await rateLimit(ip, token);
      if (result === "duplicate") return reply(409, "This form was already submitted. Please try again with a new message.");
      if (result === "limited") return reply(429, "You've sent several messages recently. Please try again in an hour.", { "Retry-After": String(GLOBAL_WINDOW) });
    } catch {
      console.error("Contact rate limiter unavailable; submission was not sent.");
      return reply(503, "Contact is temporarily unavailable. Please try again shortly.");
    }

    try {
      const { name, email, message } = parsed.data;
      const response = await fetcher("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `siona-contact-${token.id}`,
        },
        body: JSON.stringify({
          from: config.from,
          to: [config.to],
          reply_to: email,
          subject: "New inquiry — SIONA",
          text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error("Provider rejected message");
      const result: { id?: unknown } = await response.json();
      if (typeof result.id !== "string" || !result.id) throw new Error("Provider did not confirm acceptance");
      return reply(200, "Your message has been sent.");
    } catch {
      // Do not log submissions, tokens, provider responses, or credentials.
      console.error("Contact email could not be confirmed by the provider.");
      return reply(502, "We couldn't confirm your message was sent. Please wait a moment before trying again.");
    }
  }

  return { GET, POST };
}
