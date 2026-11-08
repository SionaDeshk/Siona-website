import Link from "next/link";
import { configured } from "@/lib/passport/server";
import { recoveryCallback } from "@/lib/passport/auth-validation";
import { RecoveryForm } from "./form";
export default function ForgotPassword() {
  const available =
    configured() && Boolean(recoveryCallback(process.env.NEXT_PUBLIC_SITE_URL));
  return (
    <main id="main" className="passport-login">
      <Link href="/passport/login">← Back to sign in</Link>
      <h1>
        Let’s get you
        <br />
        <em>back in.</em>
      </h1>
      <p>
        Request a link to choose a new Passport password. Open it in this same
        browser.
      </p>
      {!available && (
        <p role="status" className="notice">
          Password recovery is awaiting configuration. Please try again later.
        </p>
      )}
      <RecoveryForm available={available} />
    </main>
  );
}
