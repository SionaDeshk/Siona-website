import { redirect } from "next/navigation";
import { requireMember, AccessError } from "@/lib/intelligence/auth";
import { Workspace } from "@/components/intelligence/workspace";
import { signOut } from "../login/actions";
import styles from "@/components/intelligence/workspace.module.css";

export default async function IntelligenceWorkspace() {
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
      <Workspace
        userId={context.user.id}
        role={context.member.role}
        displayName={context.member.display_name}
        signOut={signOut}
      />
    );
  return (
    <main id="main" className={`${styles.root} ${styles.login}`}>
      <div className={styles.loginCard}>
        <h1>Access not granted.</h1>
        <p>{message}</p>
        <form action={signOut}>
          <button>Sign out</button>
        </form>
      </div>
    </main>
  );
}
