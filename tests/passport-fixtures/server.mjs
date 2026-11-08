// Loopback-only fake provider for UI regressions. No hosted projects or real credentials.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
const userId = "11111111-1111-4111-8111-111111111111";
const ceId = "22222222-2222-4222-8222-222222222222";
const docId = "33333333-3333-4333-8333-333333333333";
const user = {
  id: userId,
  aud: "authenticated",
  role: "authenticated",
  email: "fixture@example.test",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};
const jwt = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: userId, role: "authenticated", aud: "authenticated", exp: 4102444800, iat: 1700000000 })).toString("base64url")}.fixture-signature`;
let tables, failNext;
function reset() {
  tables = {
    passport_profiles: [{ user_id: userId, display_name: "Test Nurse" }],
    passport_licenses: [],
    passport_ce_entries: [
      {
        id: ceId,
        user_id: userId,
        title: "Synthetic course",
        provider: "Test Provider",
        hours: 2,
        completed_on: "2026-01-01",
        accreditation: null,
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
    passport_certifications: [],
    passport_documents: [
      {
        id: docId,
        user_id: userId,
        storage_path: `${userId}/synthetic.pdf`,
        original_filename: "synthetic-certificate.pdf",
        mime_type: "application/pdf",
        bytes: 100,
        ce_entry_id: ceId,
        license_id: null,
        certification_id: null,
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
  };
  failNext = null;
}
reset();
createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:54331");
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks);
  const send = (status, data) => {
    response.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    response.end(JSON.stringify(data));
  };
  try {
    if (url.pathname === "/health") return send(200, { ok: true });
    if (url.pathname === "/control/reset") {
      reset();
      return send(200, { ok: true });
    }
    if (url.pathname === "/control/fail-next") {
      failNext = JSON.parse(raw.toString()).operation;
      return send(200, { ok: true });
    }
    if (url.pathname === "/auth/v1/token")
      return send(200, {
        access_token: jwt,
        refresh_token: "fixture-refresh-token",
        token_type: "bearer",
        expires_in: 3600,
        user,
      });
    if (url.pathname === "/auth/v1/user")
      return request.headers.authorization === `Bearer ${jwt}`
        ? send(200, user)
        : send(401, { message: "Not authenticated" });
    if (url.pathname === "/auth/v1/logout") return send(200, {});
    if (url.pathname.startsWith("/rest/v1/")) {
      const table = url.pathname.split("/").pop();
      if (!(table in tables))
        return send(404, { message: "Unknown fixture table" });
      const matches = (row) =>
        [...url.searchParams].every(
          ([field, filter]) =>
            !filter.startsWith("eq.") || String(row[field]) === filter.slice(3),
        );
      let rows = tables[table].filter(matches);
      if (request.method !== "GET" && failNext === table) {
        failNext = null;
        return send(400, {
          code: "P0001",
          message: "Synthetic provider failure",
        });
      }
      if (request.method === "POST") {
        const values = JSON.parse(raw.toString());
        const row = {
          id: randomUUID(),
          created_at: new Date().toISOString(),
          ...values,
        };
        if (table === "passport_profiles")
          tables[table] = tables[table].filter(
            (existing) => existing.user_id !== row.user_id,
          );
        tables[table].push(row);
        rows = [row];
      } else if (request.method === "PATCH") {
        const values = JSON.parse(raw.toString());
        rows.forEach((row) => Object.assign(row, values));
      } else if (request.method === "DELETE") {
        tables[table] = tables[table].filter((row) => !matches(row));
        const field = {
          passport_ce_entries: "ce_entry_id",
          passport_licenses: "license_id",
          passport_certifications: "certification_id",
        }[table];
        if (field)
          for (const doc of tables.passport_documents)
            if (rows.some((row) => row.id === doc[field])) doc[field] = null;
      }
      const single = request.headers.accept?.includes(
        "application/vnd.pgrst.object+json",
      );
      return send(200, single ? rows[0] : rows);
    }
    if (url.pathname.startsWith("/storage/v1/object/")) {
      if (failNext === "storage") {
        failNext = null;
        return send(400, {
          statusCode: "400",
          error: "Synthetic upload failure",
          message: "Synthetic upload failure",
        });
      }
      return send(200, { Key: url.pathname.split("/object/")[1] });
    }
    return send(404, { message: "Unsupported fixture endpoint" });
  } catch {
    return send(500, { message: "Fixture request failed" });
  }
}).listen(54331, "127.0.0.1", () =>
  console.log("Passport UI fixture listening on loopback"),
);
