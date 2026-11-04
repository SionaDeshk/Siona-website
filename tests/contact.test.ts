import assert from "node:assert/strict";
import { test } from "node:test";
import { createContactHandlers, type ContactConfig } from "../src/lib/server/contact";
import { contactSchema } from "../src/lib/contact-schema";

const validFields = { name: "Test Person", email: "test@example.com", message: "A thoughtful test message for Siona." };
const baseConfig: ContactConfig = { production: false, apiKey: "test-key", from: "sender@example.com", to: "inbox@example.com" };

function harness(overrides: Partial<ContactConfig> = {}, providerStatus = 200) {
  let time = 1_800_000_000_000;
  const calls: { url: string; body: Record<string, unknown>; headers: Headers }[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ url: String(input), body: JSON.parse(String(init?.body)), headers: new Headers(init?.headers) });
    return Response.json({ id: "test-message-id" }, { status: providerStatus });
  };
  const handlers = createContactHandlers({ ...baseConfig, ...overrides }, fetcher, () => time);
  async function token() {
    const result = await handlers.GET();
    const body = await result.json();
    time += 2100;
    return body.token as string;
  }
  function request(body: unknown, headers: Record<string, string> = {}) {
    return new Request("https://siona.example/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://siona.example", "x-forwarded-for": "192.0.2.1", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  }
  return { handlers, token, request, calls, advance: (ms: number) => { time += ms; } };
}

test("normalizes input and rejects invalid fields and header injection", () => {
  const parsed = contactSchema.parse({ ...validFields, name: "  Test Person  ", email: " test@example.com " });
  assert.equal(parsed.name, "Test Person");
  assert.equal(parsed.email, "test@example.com");
  for (const fields of [
    { ...validFields, name: "a" },
    { ...validFields, name: "Name\r\nBcc: attacker@example.com" },
    { ...validFields, email: "invalid" },
    { ...validFields, message: "short" },
    { ...validFields, message: "a".repeat(5001) },
  ]) assert.equal(contactSchema.safeParse(fields).success, false);
});

test("sends validated plain text through Resend with reply-to and idempotency", async () => {
  const h = harness();
  const response = await h.handlers.POST(h.request({ ...validFields, token: await h.token() }));
  assert.equal(response.status, 200);
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].url, "https://api.resend.com/emails");
  assert.equal(h.calls[0].body.reply_to, validFields.email);
  assert.deepEqual(h.calls[0].body.to, ["inbox@example.com"]);
  assert.match(String(h.calls[0].body.text), /Test Person/);
  assert.equal(h.calls[0].body.html, undefined);
  assert.match(h.calls[0].headers.get("Idempotency-Key")!, /^siona-contact-/);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("rejects cross-origin and missing-origin submissions", async () => {
  const h = harness();
  const body = { ...validFields, token: await h.token() };
  assert.equal((await h.handlers.POST(h.request(body, { Origin: "https://attacker.example" }))).status, 403);
  const request = h.request(body);
  request.headers.delete("origin");
  assert.equal((await h.handlers.POST(request)).status, 403);
  assert.equal(h.calls.length, 0);
});

test("rejects malformed, oversized, and non-JSON requests", async () => {
  const h = harness();
  assert.equal((await h.handlers.POST(h.request("not json"))).status, 400);
  assert.equal((await h.handlers.POST(h.request("x".repeat(24001)))).status, 413);
  assert.equal((await h.handlers.POST(h.request({}, { "Content-Type": "text/plain" }))).status, 415);
  assert.equal(h.calls.length, 0);
});

test("enforces server validation even if the client is bypassed", async () => {
  const h = harness();
  assert.equal((await h.handlers.POST(h.request({ ...validFields, email: "bad", token: await h.token() }))).status, 400);
  assert.equal(h.calls.length, 0);
});

test("silently discards honeypot submissions without sending email", async () => {
  const h = harness();
  assert.equal((await h.handlers.POST(h.request({ ...validFields, website: "spam", token: "bot" }))).status, 200);
  assert.equal(h.calls.length, 0);
});

test("rejects tampered, premature, expired, and replayed tokens", async () => {
  const h = harness();
  const fresh = (await (await h.handlers.GET()).json()).token;
  assert.equal((await h.handlers.POST(h.request({ ...validFields, token: fresh }))).status, 400);
  h.advance(2100);
  assert.equal((await h.handlers.POST(h.request({ ...validFields, token: fresh + "x" }))).status, 400);
  assert.equal((await h.handlers.POST(h.request({ ...validFields, token: fresh }))).status, 200);
  assert.equal((await h.handlers.POST(h.request({ ...validFields, token: fresh }))).status, 409);
  const old = await h.token();
  h.advance(3600001);
  assert.equal((await h.handlers.POST(h.request({ ...validFields, token: old }))).status, 400);
  assert.equal(h.calls.length, 1);
});

test("limits a client to five requests and allows requests after expiry", async () => {
  const h = harness();
  for (let i = 0; i < 5; i++) assert.equal((await h.handlers.POST(h.request({ ...validFields, token: await h.token() }))).status, 200);
  const limited = await h.handlers.POST(h.request({ ...validFields, token: await h.token() }));
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("retry-after"), "3600");
  assert.equal(h.calls.length, 5);
  h.advance(900001);
  assert.equal((await h.handlers.POST(h.request({ ...validFields, token: await h.token() }))).status, 200);
});

test("requires email configuration instead of reporting false success", async () => {
  const h = harness({ apiKey: undefined });
  assert.equal((await h.handlers.POST(h.request({ ...validFields, token: await h.token() }))).status, 503);
  assert.equal(h.calls.length, 0);
});

test("requires a strong production secret and shared rate limiting", async () => {
  const noSecret = harness({ production: true });
  assert.equal((await noSecret.handlers.GET()).status, 503);
  const noRedis = harness({ production: true, secret: "s".repeat(64) });
  assert.equal((await noRedis.handlers.POST(noRedis.request({ ...validFields, token: await noRedis.token() }))).status, 503);
  assert.equal(noRedis.calls.length, 0);
});

test("uses Redis atomically, hashes IPs, and fails closed when Redis fails", async () => {
  let time = 1_800_000_000_000;
  const commands: unknown[][] = [];
  let redisResult = 1;
  let emails = 0;
  const fetcher: typeof fetch = async (input, init) => {
    if (String(input).includes("redis.example")) {
      commands.push(JSON.parse(String(init?.body)));
      if (redisResult === -1) throw new Error("Redis down");
      return Response.json({ result: redisResult });
    }
    emails++;
    return Response.json({ id: "test-id" });
  };
  const handlers = createContactHandlers({ ...baseConfig, production: true, secret: "s".repeat(64), redisUrl: "https://redis.example", redisToken: "test-redis-token" }, fetcher, () => time);
  const h = harness();
  async function send() {
    const token = (await (await handlers.GET()).json()).token;
    time += 2100;
    return handlers.POST(h.request({ ...validFields, token }));
  }
  assert.equal((await send()).status, 200);
  assert.equal(commands[0][0], "EVAL");
  assert.equal(commands[0][2], "3");
  assert.doesNotMatch(JSON.stringify(commands), /192\.0\.2\.1/);
  redisResult = 0;
  assert.equal((await send()).status, 429);
  redisResult = 2;
  assert.equal((await send()).status, 409);
  redisResult = -1;
  assert.equal((await send()).status, 503);
  assert.equal(emails, 1);
});

test("provider errors do not expose credentials or claim successful delivery", async () => {
  const h = harness({}, 500);
  const response = await h.handlers.POST(h.request({ ...validFields, token: await h.token() }));
  assert.equal(response.status, 502);
  assert.doesNotMatch(await response.text(), /test-key|test@example.com|Test Person/);
});
