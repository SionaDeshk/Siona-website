import Link from "next/link";
import { authenticated } from "@/lib/passport/server";
import { PasswordForm } from "./form";
export const dynamic = "force-dynamic";
export default async function ResetPassword() {
  await authenticated();
  return (
    <main id="main" className="passport-login">
      <Link href="/passport/login">← Back to sign in</Link>
      <h1>
        A fresh
        <br />
        <em>start.</em>
      </h1>
      <p>Choose a new password with at least eight characters.</p>
      <PasswordForm />
    </main>
  );
}
