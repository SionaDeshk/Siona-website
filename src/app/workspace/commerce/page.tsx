import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccessError, requireMember } from "@/lib/intelligence/auth";
import { CommerceWorkspace } from "@/components/commerce/workspace";
import { signOut } from "../login/actions";
export const metadata: Metadata = { title: "Siona Quotes and Fulfillment" };
export default async function CommercePage({
  searchParams,
}: {
  searchParams: Promise<{ request?: string }>;
}) {
  let context: Awaited<ReturnType<typeof requireMember>> | undefined;
  let message = "Access is unavailable.";
  try {
    context = await requireMember();
  } catch (error) {
    if (!(error instanceof AccessError)) throw error;
    if (error.status === 401 || error.status === 503)
      redirect("/workspace/login");
    message = error.message;
  }
  if (context) {
    const { request } = await searchParams;
    return (
      <CommerceWorkspace
        role={context.member.role}
        displayName={context.member.display_name}
        signOut={signOut}
        initialRequest={request}
      />
    );
  }
  return (
    <main id="main" style={{ padding: "10vh 8vw" }}>
      <h1>Access unavailable.</h1>
      <p>{message}</p>
      <Link href="/workspace/login">Return to sign in</Link>
    </main>
  );
}
