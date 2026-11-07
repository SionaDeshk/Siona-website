import Link from "next/link";
import { configured } from "@/lib/passport/server";
import { login } from "./actions";
const messages: Record<string, string> = {
  configuration: "Passport setup is required before signing in.",
  invalid: "Enter a valid email and a password of at least 8 characters.",
  failed: "Unable to authenticate. Check your details or try again later.",
  confirm: "Check your email to confirm your account, then sign in.",
};
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  return (
    <main id="main" className="passport-login">
      <Link href="/">SIONA ↗</Link>
      <p className="eyebrow">YOUR PROFESSIONAL JOURNEY</p>
      <h1>
        One place.
        <br />
        <em>Your Passport.</em>
      </h1>
      <p>
        Keep your licenses, learning, and certifications together in your
        private credential vault.
      </p>
      {!configured() && (
        <p role="status" className="notice">
          Passport is awaiting Supabase configuration. Sign-in is currently
          unavailable.
        </p>
      )}
      {message && (
        <p role="status" className="notice">
          {messages[message] || "Please try again."}
        </p>
      )}
      <form action={login}>
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
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
            minLength={8}
            maxLength={128}
          />
        </label>
        <button name="mode" value="login" disabled={!configured()}>
          Sign in →
        </button>
        <button
          className="secondary"
          name="mode"
          value="signup"
          disabled={!configured()}
        >
          Create an account
        </button>
      </form>
      <small>
        Self-reported credentials. Documents are not verified by Siona.
      </small>
    </main>
  );
}
