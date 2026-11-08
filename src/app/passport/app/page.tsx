export const dynamic = "force-dynamic";
import Link from "next/link";
import { SubmitButton } from "../submit-button";
import { allRecords } from "@/lib/passport/records";
import { authenticated } from "@/lib/passport/server";
import { ceTotal } from "@/lib/passport/validation";
import { z } from "zod";
import { logout } from "../login/actions";
import { deleteCredential, deleteDocument } from "./actions";
import { PlanningPanel } from "./planning-panel";
import { ProfileForm } from "./profile-form";
import { UploadForm } from "./upload-form";
import {
  credentialOptions,
  documentCredentialKey,
  groupLinkedDocuments,
} from "@/lib/passport/credential-links";
import { RecordFilter } from "./record-filter";
import { expiryState, expiryLabel } from "@/lib/passport/record-filters";
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
  const { data: documents, error: docError } = await allRecords(
    db,
    "passport_documents",
    user.id,
  );
  const { data: profile, error: profileError } = await db
    .from("passport_profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  const rows = results.map((r) => (r.data || []) as Row[]);
  const options = credentialOptions(rows);
  const optionsByKey = new Map(options.map((option) => [option.value, option]));
  const linkedDocuments = groupLinkedDocuments(documents || []);
  const errors = results.some((r) => r.error) || docError || profileError;
  const reminders = [...rows[0], ...rows[2]]
    .filter((row) =>
      ["expired", "due"].includes(
        expiryState(row.expires_on ? String(row.expires_on) : null, today),
      ),
    )
    .sort((a, b) => String(a.expires_on).localeCompare(String(b.expires_on)));
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
          <SubmitButton className="secondary" pendingLabel="Signing out…">
            Sign out
          </SubmitButton>
        </form>
      </header>
      <nav aria-label="Passport sections">
        <a href="#overview">Overview</a>
        <a href="#licenses">Licenses</a>
        <a href="#ce_entries">Learning</a>
        <a href="#certifications">Certifications</a>
        <a href="#documents">Documents</a>
        <a href="#planning">Planning</a>
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
            : params.message === "password-updated"
              ? "Your password has been updated."
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
              <a href={`#credential-${r.id}`}>
                {r.name || `${r.jurisdiction} ${r.license_type}`}
              </a>{" "}
              · {String(r.expires_on) < today ? "Expired" : "Expires"}{" "}
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
          <RecordFilter
            label={
              ["licenses", "continuing education", "certifications"][index]
            }
            mode={kind === "ce_entries" ? "search" : "expiry"}
            items={rows[index].map((row) => ({
              id: `credential-${row.id}`,
              text: [
                row.title,
                row.provider,
                row.accreditation,
                row.completed_on,
                row.name,
                row.issuer,
                row.jurisdiction,
                row.license_type,
                row.license_number,
              ]
                .filter(Boolean)
                .join(" "),
              expiry: expiryState(
                row.expires_on ? String(row.expires_on) : null,
                today,
              ),
            }))}
          >
            {rows[index].map((row) => (
              <article
                key={row.id}
                className="record"
                id={`credential-${row.id}`}
              >
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
                {kind !== "ce_entries" && (
                  <p
                    className={`expiry-badge expiry-${expiryState(row.expires_on ? String(row.expires_on) : null, today)}`}
                  >
                    {expiryLabel(
                      row.expires_on ? String(row.expires_on) : null,
                      today,
                    )}
                  </p>
                )}
                <small>Self-reported · Not verified by Siona</small>
                {(linkedDocuments.get(`${kind}:${row.id}`) || []).length >
                  0 && (
                  <div className="linked-documents">
                    <p>Attached documents</p>
                    <ul>
                      {linkedDocuments.get(`${kind}:${row.id}`)!.map((doc) => (
                        <li key={doc.id}>
                          <a href={`#document-${doc.id}`}>
                            {doc.original_filename}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <details>
                  <summary>Edit record</summary>
                  <CredentialForm kind={kind} row={row} />
                </details>
                <form action={deleteCredential}>
                  <input type="hidden" name="kind" value={kind} />
                  <input type="hidden" name="id" value={String(row.id)} />
                  <SubmitButton
                    className="danger"
                    pendingLabel="Deleting…"
                    confirmText="Delete this credential record? Linked documents will stay in your vault; its renewal tasks will be deleted."
                  >
                    Delete record
                  </SubmitButton>
                </form>
              </article>
            ))}
          </RecordFilter>
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
        <UploadForm options={options} />
        {!documents?.length && (
          <p className="empty">
            Your private vault is ready for your first certificate.
          </p>
        )}
        <RecordFilter
          label="documents"
          mode="documents"
          items={(documents || []).map((doc) => ({
            id: `document-${doc.id}`,
            text: [
              doc.original_filename,
              optionsByKey.get(documentCredentialKey(doc) || "")?.label,
            ]
              .filter(Boolean)
              .join(" "),
            linked: Boolean(documentCredentialKey(doc)),
          }))}
        >
          {(documents || []).map((doc) => (
            <article className="record" key={doc.id} id={`document-${doc.id}`}>
              <a href={`/passport/documents/${doc.id}`}>
                {doc.original_filename} ↗
              </a>
              {(() => {
                const key = documentCredentialKey(doc);
                const linked = key ? optionsByKey.get(key) : undefined;
                return (
                  <p className="document-link">
                    {linked ? (
                      <>
                        Linked to: <a href={linked.href}>{linked.label}</a>
                      </>
                    ) : key ? (
                      "Linked credential could not be loaded."
                    ) : (
                      "No linked credential"
                    )}
                  </p>
                );
              })()}
              <Link
                className="passport-link"
                href={`/passport/documents/${doc.id}/view`}
                prefetch={false}
              >
                Preview document
              </Link>
              <small>
                {(Number(doc.bytes) / 1024).toFixed(0)} KB · Private · Download
                link expires in 60 seconds
              </small>
              <form action={deleteDocument}>
                <input type="hidden" name="id" value={String(doc.id)} />
                <SubmitButton
                  className="danger"
                  pendingLabel="Deleting…"
                  confirmText="Permanently delete this document from your private vault?"
                >
                  Delete document
                </SubmitButton>
              </form>
            </article>
          ))}
        </RecordFilter>
      </section>
      <PlanningPanel
        db={db}
        userId={user.id}
        options={options}
        entries={
          results[1].error
            ? null
            : rows[1].map((row) => ({
                hours: Number(row.hours),
                completed_on: String(row.completed_on),
              }))
        }
        today={today}
      />
      <section className="passport-card">
        <h2>Your profile</h2>
        <ProfileForm displayName={profile?.display_name || ""} />
      </section>
      <footer>
        Self-reported. Always yours. <Link href="/">Back to Siona ↗</Link>
      </footer>
    </main>
  );
}
