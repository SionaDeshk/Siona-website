import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccessError, requireMember } from "@/lib/intelligence/auth";
import { signOut } from "../login/actions";
import { OperationsWorkspace } from "@/components/operations/workspace";

export const metadata: Metadata = { title: "Siona Operations" };
export default async function OperationsPage() {
  let context: Awaited<ReturnType<typeof requireMember>> | undefined;
  let message = "Your account has not been granted access.";
  try {
    context = await requireMember();
  } catch (error) {
    if (!(error instanceof AccessError)) throw error;
    if (error.status === 401 || error.status === 503)
      redirect("/workspace/login");
    message = error.message;
  }
  if (context)
    return (
      <OperationsWorkspace
        role={context.member.role}
        displayName={context.member.display_name}
        signOut={signOut}
      />
    );
  return (
    <main id="main" style={{ padding: "10vh 8vw" }}>
      <h1>Access not granted.</h1>
      <p>{message}</p>
      <Link href="/workspace/login">Return to sign in</Link>
    </main>
  );
}
