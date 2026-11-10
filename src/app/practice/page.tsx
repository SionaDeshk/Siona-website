import { redirect } from "next/navigation";
import { AccessError } from "@/lib/intelligence/auth";
import { requirePracticeUser } from "@/lib/practice/auth";
import { PracticeWorkspace } from "@/components/practice/workspace";
import { practiceSignOut } from "./login/actions";
import styles from "@/components/practice/workspace.module.css";
export default async function PracticePage() {
  let context: Awaited<ReturnType<typeof requirePracticeUser>> | undefined;
  let message = "Practice access is unavailable.";
  try {
    context = await requirePracticeUser();
  } catch (error) {
    if (!(error instanceof AccessError)) throw error;
    if (error.status === 401) redirect("/practice/login");
    message = error.message;
  }
  if (context)
    return (
      <PracticeWorkspace
        locations={context.practices}
        signOut={practiceSignOut}
      />
    );
  return (
    <main id="main" className={`${styles.root} ${styles.login}`}>
      <section className={styles.loginCard}>
        <span className={styles.eyebrow}>SIONA / PRACTICE ACCESS</span>
        <h1>Access unavailable.</h1>
        <p>{message}</p>
        <form action={practiceSignOut}>
          <button>Sign out</button>
        </form>
      </section>
    </main>
  );
}
