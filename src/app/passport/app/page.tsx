export const dynamic = "force-dynamic";
import Link from "next/link";
import { allRecords } from "@/lib/passport/records";
import { authenticated } from "@/lib/passport/server";
import { ceTotal } from "@/lib/passport/validation";
import { z } from "zod";
import { logout } from "../login/actions";
import {
  deleteCredential,
  deleteDocument,
  saveProfile,
  uploadDocument,
} from "./actions";
import { CredentialForm } from "./credential-form";
type Row = Record<string, string | number | null>;
export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; message?: string }>;
}) {
  const { db, user } = await authenticated();
  const params = await searchParams;
  const today = new Date().toISOString().slice(0, 10);
  const from = z.iso.date().safeParse(params.from).success
    ? params.from!
    : `${today.slice(0, 4)}-01-01`;
  const to = z.iso.date().safeParse(params.to).success ? params.to! : today;
  const kinds = ["licenses", "ce_entries", "certifications"] as const;
  const results = await Promise.all(
    kinds.map((kind) => allRecords(db, `passport_${kind}`, user.id)),
  );
  const { data: documents, error: docError } = await db
    .from("passport_documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const { data: profile, error: profileError } = await db
    .from("passport_profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  const rows = results.map((r) => (r.data || []) as Row[]);
  const errors = results.some((r) => r.error) || docError || profileError;
  const reminders = [...rows[0], ...rows[2]].filter(
    (row) =>
      row.expires_on &&
      String(row.expires_on) <=
        new Date(new Date(today).getTime() + 90 * 86400000)
          .toISOString()
          .slice(0, 10),
  );
  const total = ceTotal(
    rows[1].map((r) => ({
      hours: Number(r.hours),
      completed_on: String(r.completed_on),
    })),
    from,
    to,
  );
  return (
    <main id="main" className="passport-shell">
      <header className="passport-header">
        <Link href="/">
          SIONA <span>/ Passport</span>
        </Link>
        <form action={logout}>
          <button className="secondary">Sign out</button>
        </form>
      </header>
      <nav aria-label="Passport sections">
        <a href="#overview">Overview</a>
        <a href="#licenses">Licenses</a>
        <a href="#ce_entries">Learning</a>
        <a href="#certifications">Certifications</a>
        <a href="#documents">Documents</a>
      </nav>
      <section id="overview">
        <p className="eyebrow">YOUR CAREER, IN YOUR HANDS</p>
        <h1>
          Welcome{profile?.display_name ? `, ${profile.display_name}` : ""}.
          <br />
          <em>Keep moving forward.</em>
        </h1>
        <p>A little clarity for everything you’ve earned.</p>
      </section>
      {params.message && (
        <p role="status" className="notice">
          {params.message === "saved"
            ? "Your changes have been saved."
            : "Unable to save. Check your inputs and try again; your session or project configuration may need attention."}
        </p>
      )}
      {errors && (
        <p role="alert" className="notice">
          We couldn’t load all your records. Refresh and try again. If this
          persists, verify the Passport migrations and Supabase configuration.
        </p>
      )}
      <div className="passport-stats">
        <article>
          <strong>{total.toFixed(2)}</strong>
          <span>CE hours in selected range</span>
        </article>
        <article>
          <strong>{rows[0].length}</strong>
          <span>Licenses recorded</span>
        </article>
        <article>
          <strong>{reminders.length}</strong>
          <span>Expired or due within 90 days</span>
        </article>
      </div>
      <section className="passport-card">
        <h2>Your learning window</h2>
        <form method="get" className="filter">
          <label>
            From
            <input type="date" name="from" defaultValue={from} required />
          </label>
          <label>
            To
            <input type="date" name="to" defaultValue={to} required />
          </label>
          <button>Apply dates</button>
        </form>
        {from > to && (
          <p role="alert">Choose an end date on or after the start date.</p>
        )}
        <p className="muted">
          CE totals reflect your records only. Eligibility and requirements vary
          by jurisdiction; hours are not automatically transferable.
        </p>
        <a
          className="passport-link"
          href={`/passport/export?from=${from}&to=${to}`}
        >
          Download self-reported Passport PDF ↗
        </a>
      </section>
      {reminders.length > 0 && (
        <section className="passport-card">
          <h2>On the horizon</h2>
          {reminders.map((r) => (
            <p key={r.id}>
              {r.name || `${r.jurisdiction} ${r.license_type}`} ·{" "}
              {String(r.expires_on) < today ? "Expired" : "Expires"}{" "}
              {r.expires_on}
            </p>
          ))}
        </section>
      )}
      {kinds.map((kind, index) => (
        <section id={kind} className="passport-card" key={kind}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {["YOUR PRACTICE", "YOUR GROWTH", "YOUR EXPERTISE"][index]}
              </p>
              <h2>
                {["Licenses", "Continuing education", "Certifications"][index]}
              </h2>
            </div>
            <span>{rows[index].length} records</span>
          </div>
          <details>
            <summary>
              Add {["a license", "CE learning", "a certification"][index]} +
            </summary>
            <CredentialForm kind={kind} />
          </details>
          {!rows[index].length && (
            <p className="empty">
              Your next chapter starts here. Add your first record.
            </p>
          )}
          {rows[index].map((row) => (
            <article key={row.id} className="record">
              <h3>
                {row.title ||
                  row.name ||
                  `${row.jurisdiction} · ${row.license_type}`}
              </h3>
              <p>
                {kind === "ce_entries"
                  ? `${row.provider} · ${row.hours} hours · ${row.completed_on}`
                  : kind === "licenses"
                    ? `${row.license_number || "No number"} · ${row.status}`
                    : row.issuer}
              </p>
              {row.expires_on && <p>Expires {row.expires_on}</p>}
              <small>Self-reported · Not verified by Siona</small>
              <details>
                <summary>Edit record</summary>
                <CredentialForm kind={kind} row={row} />
              </details>
              <form action={deleteCredential}>
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="id" value={String(row.id)} />
                <button className="danger">Delete record</button>
              </form>
            </article>
          ))}
        </section>
      ))}
      <section id="documents" className="passport-card">
        <p className="eyebrow">PRIVATE BY DESIGN</p>
        <h2>Credential vault</h2>
        <p>
          Upload credential certificates only. Do not upload PHI, patient
          records, SSNs, driver’s licenses, or background checks. Uploads are
          not verified by Siona.
        </p>
        <form action={uploadDocument} className="credential-form">
          <label>
            Document (PDF, PNG, JPEG · up to 4 MB)
            <input
              type="file"
              name="file"
              accept="application/pdf,image/png,image/jpeg"
              required
            />
          </label>
          <label>
            Link to a credential
            <select name="credential">
              <option value="">No linked credential</option>
              {kinds.flatMap((kind, index) =>
                rows[index].map((row) => (
                  <option key={row.id} value={`${kind}:${row.id}`}>
                    {row.title ||
                      row.name ||
                      `${row.jurisdiction} ${row.license_type}`}
                  </option>
                )),
              )}
            </select>
          </label>
          <button>Upload privately</button>
        </form>
        {!documents?.length && (
          <p className="empty">
            Your private vault is ready for your first certificate.
          </p>
        )}
        {documents?.map((doc) => (
          <article className="record" key={doc.id}>
            <a href={`/passport/documents/${doc.id}`}>
              {doc.original_filename} ↗
            </a>
            <small>
              {(doc.bytes / 1024).toFixed(0)} KB · Private · Download link
              expires in 60 seconds
            </small>
            <form action={deleteDocument}>
              <input type="hidden" name="id" value={doc.id} />
              <button className="danger">Delete document</button>
            </form>
          </article>
        ))}
      </section>
      <section className="passport-card">
        <h2>Your profile</h2>
        <form action={saveProfile} className="filter">
          <label>
            Display name
            <input
              name="display_name"
              maxLength={120}
              required
              defaultValue={profile?.display_name || ""}
            />
          </label>
          <button>Save profile</button>
        </form>
      </section>
      <footer>
        Self-reported. Always yours. <Link href="/">Back to Siona ↗</Link>
      </footer>
    </main>
  );
}
