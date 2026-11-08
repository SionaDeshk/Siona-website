import Link from "next/link";
import { signIn } from "./actions";
import { supabaseConfig } from "@/lib/intelligence/auth";
import styles from "@/components/intelligence/workspace.module.css";

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams,
    configured = !!supabaseConfig();
  return (
    <main id="main" className={`${styles.root} ${styles.login}`}>
      <div className={styles.loginCard}>
        <Link href="/" className={styles.wordmark}>
          SIONA <span>INTELLIGENCE</span>
        </Link>
        <p className={styles.eyebrow}>PRIVATE WORKSPACE</p>
        <h1>
          From evidence
          <br />
          to action.
        </h1>
        <p>Sign in to the Siona Evolution Engine.</p>
        {!configured && (
          <div className={styles.notice}>
            <strong>Project connection required</strong>
            <p>
              Connect the existing Supabase project, apply the supplied
              migration, and provision an internal member. See{" "}
              <code>docs/evolution-engine.md</code>. Access remains closed until
              configured.
            </p>
          </div>
        )}
        {error && (
          <p role="alert" className={styles.error}>
            {error === "configuration"
              ? "The Supabase connection is not configured."
              : "Sign-in failed. Check your credentials or contact your workspace administrator."}
          </p>
        )}
        <form action={signIn}>
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={1000}
            />
          </label>
          <button className={styles.primary} disabled={!configured}>
            Sign in →
          </button>
        </form>
        <p className={styles.small}>
          Access is invitation-only. A Supabase account alone does not grant
          access to internal records.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <Link
            href="/workspace/intelligence/preview"
            className={styles.previewLink}
          >
            View synthetic design preview ↗
          </Link>
        )}
      </div>
    </main>
  );
}
