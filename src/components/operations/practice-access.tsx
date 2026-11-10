import Link from "next/link";
import type { OperationsData } from "@/lib/operations/model";
import type { Editor } from "./forms";
import styles from "./workspace.module.css";
export function PracticeAccess({
  data,
  admin,
  open,
}: {
  data: OperationsData;
  admin: boolean;
  open: (action: Editor["action"], record?: object) => void;
}) {
  if (!data.portal_ready)
    return (
      <section className={styles.panel}>
        <h2>Practice access is the next database update.</h2>
        <p>
          The internal Operations workflow remains available. Apply the practice
          portal migration to activate account linking and catalog publications.
        </p>
      </section>
    );
  return (
    <>
      <section className={`${styles.panel} ${styles.guide}`}>
        <div className={styles.row}>
          <h2>Give each practice its own view.</h2>
          <Link href="/practice">Open practice portal →</Link>
        </div>
        <p>
          Link an existing Supabase Auth account to a practice location. Choose
          whether that person can submit requests or only view them. Account
          linking does not send an invitation.
        </p>
        <button
          disabled={!admin || !data.practices.length}
          onClick={() => open("practice_access")}
        >
          Link practice account +
        </button>
      </section>
      <div className={styles.cards} style={{ marginTop: 22 }}>
        {data.practice_access.map((m) => (
          <article key={m.id} className={styles.panel}>
            <span className={styles.eyebrow}>
              {m.active ? "ACTIVE ACCESS" : "ACCESS DISABLED"}
            </span>
            <h2>
              {data.practices.find((p) => p.id === m.practice_id)?.legal_name ||
                "Practice location"}
            </h2>
            <p>{m.email}</p>
            <p>
              {m.role === "requester"
                ? "Can submit and view practice requests"
                : "Can view practice requests"}
            </p>
            <button
              disabled={!admin}
              onClick={() => open("practice_access", m)}
            >
              Edit permissions
            </button>
          </article>
        ))}
      </div>
      {!admin && (
        <p>Practice membership is managed by your Siona administrator.</p>
      )}
      {admin && !data.practice_access.length && (
        <p>No practice accounts have been linked yet.</p>
      )}
    </>
  );
}
