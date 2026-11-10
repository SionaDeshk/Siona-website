import Link from "next/link";
import { BrandSymbol } from "@/components/brand-symbol";
import { supabaseConfig } from "@/lib/intelligence/auth";
import { practiceSignIn } from "./actions";
import styles from "@/components/practice/workspace.module.css";
export default async function PracticeLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const configured = !!supabaseConfig();
  return (
    <main id="main" className={`${styles.root} ${styles.login}`}>
      <div className={styles.loginCard}>
        <Link href="/" className={styles.brand}>
          <BrandSymbol />
          <span>
            SIONA<small>PRACTICE PORTAL</small>
          </span>
        </Link>
        <span className={styles.eyebrow}>INVITATION ONLY</span>
        <h1>
          Your practice.
          <br />
          <em>Connected.</em>
        </h1>
        <p>
          Sign in to view your practice’s catalog, coordinate supply requests,
          and follow partner updates.
        </p>
        {!configured && (
          <p role="status" className={styles.notice}>
            Practice access is not configured yet.
          </p>
        )}
        {error && (
          <p role="alert" className={styles.notice}>
            {error === "access"
              ? "This account does not have active practice access. Your Siona administrator manages practice membership."
              : error === "configuration"
                ? "Practice access is not configured yet."
                : "Sign-in failed. Check your email and password."}
          </p>
        )}
        <form action={practiceSignIn}>
          <label>
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="username"
              maxLength={254}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              maxLength={1000}
            />
          </label>
          <button className={styles.primary} disabled={!configured}>
            Sign in →
          </button>
        </form>
        <p className={styles.small}>
          Use the account linked to your practice. Access and password recovery
          are managed by your Siona administrator.
        </p>
        <Link href="/">Return to Siona</Link>
      </div>
    </main>
  );
}
