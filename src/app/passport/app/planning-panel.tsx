import type { SupabaseClient } from "@supabase/supabase-js";
import type { CredentialOption } from "@/lib/passport/credential-links";
import { allRecords } from "@/lib/passport/records";
import { goalProgress, type PlanningRow } from "@/lib/passport/planning";
import { PlanningForm, PlanningDelete, TaskCompletion } from "./planning-form";
export async function PlanningPanel({
  db,
  userId,
  options,
  entries,
  today,
}: {
  db: SupabaseClient;
  userId: string;
  options: CredentialOption[];
  entries: { hours: string | number; completed_on: string }[] | null;
  today: string;
}) {
  const [goals, tasks] = await Promise.all([
    allRecords<PlanningRow>(db, "passport_ce_goals", userId),
    allRecords<PlanningRow>(db, "passport_renewal_tasks", userId),
  ]);
  const orderedTasks = [...(tasks.data || [])].sort(
    (a, b) =>
      Number(Boolean(a.completed)) - Number(Boolean(b.completed)) ||
      String(a.due_on || "9999").localeCompare(String(b.due_on || "9999")),
  );
  return (
    <section id="planning">
      <section className="passport-card">
        <p className="eyebrow">YOUR OWN DIRECTION</p>
        <h2>Personal CE goals</h2>
        <p>
          Set a personal learning target for any date range. These goals do not
          establish license requirements or guarantee that a jurisdiction
          accepts your hours. The same entry may count toward multiple
          overlapping personal goals. Only entries completed by today count
          toward progress.
        </p>
        {goals.error ? (
          <p className="notice">
            Personal CE goals are unavailable right now. Your credential vault
            is still available.
          </p>
        ) : (
          <>
            <details>
              <summary>Add a personal CE goal +</summary>
              <PlanningForm kind="ce_goals" />
            </details>
            {!goals.data?.length && (
              <p className="empty">
                Choose a personal target to see your progress here.
              </p>
            )}
            {goals.data?.map((goal) => {
              const progress = entries
                ? goalProgress(goal, entries, today)
                : null;
              return (
                <article className="record" key={String(goal.id)}>
                  <h3>{String(goal.title)}</h3>
                  <p>
                    {String(goal.starts_on)} through {String(goal.ends_on)}
                    {String(goal.ends_on) < today ? " · Period ended" : ""}
                  </p>
                  {progress ? (
                    <>
                      <label htmlFor={`goal-${goal.id}`}>
                        Progress for {String(goal.title)}
                      </label>
                      <progress
                        id={`goal-${goal.id}`}
                        max={progress.target}
                        value={Math.min(progress.hours, progress.target)}
                      />
                      <p>
                        {progress.hours.toFixed(2)} of{" "}
                        {progress.target.toFixed(2)} personal hours ·{" "}
                        {progress.remaining === 0
                          ? "Goal reached"
                          : `${progress.remaining.toFixed(2)} hours remaining`}
                      </p>
                    </>
                  ) : (
                    <p>
                      Progress unavailable because CE records could not be
                      loaded.
                    </p>
                  )}
                  <details>
                    <summary>Edit goal</summary>
                    <PlanningForm kind="ce_goals" row={goal} />
                  </details>
                  <PlanningDelete kind="ce_goals" id={String(goal.id)} />
                </article>
              );
            })}
          </>
        )}
      </section>
      <section className="passport-card">
        <p className="eyebrow">PLAN YOUR NEXT RENEWAL</p>
        <h2>Renewal planner</h2>
        <p>
          Keep your own checklist, deadlines, and fee estimates for a license or
          certification. Check requirements and fees with the issuing authority.
          Do not add patient information. Deleting a credential also deletes its
          renewal tasks.
        </p>
        {tasks.error ? (
          <p className="notice">
            Renewal planning is unavailable right now. Your credential vault is
            still available.
          </p>
        ) : (
          <>
            {options.some(
              (option) => !option.value.startsWith("ce_entries:"),
            ) ? (
              <details>
                <summary>Add a renewal task +</summary>
                <PlanningForm kind="renewal_tasks" options={options} />
              </details>
            ) : (
              <p className="empty">
                Add a license or certification first, then plan its renewal
                here.
              </p>
            )}
            {!tasks.data?.length && (
              <p className="empty">No renewal tasks yet.</p>
            )}
            {orderedTasks.map((task) => {
              const value = task.license_id
                ? `licenses:${task.license_id}`
                : `certifications:${task.certification_id}`;
              const linked = options.find((option) => option.value === value);
              return (
                <article className="record" key={String(task.id)}>
                  <h3>{String(task.title)}</h3>
                  <p>
                    {linked ? (
                      <a href={linked.href}>{linked.label}</a>
                    ) : (
                      "Linked credential could not be loaded."
                    )}
                  </p>
                  <p>
                    {task.completed
                      ? "Complete"
                      : task.due_on && String(task.due_on) < today
                        ? "Overdue"
                        : "Open"}
                    {task.due_on
                      ? ` · Due ${task.due_on}`
                      : " · No deadline recorded"}
                  </p>
                  {task.notes && (
                    <p className="planning-notes">{String(task.notes)}</p>
                  )}
                  {task.estimated_fee !== null &&
                    task.estimated_fee !== undefined && (
                      <p>
                        Estimated fee: {Number(task.estimated_fee).toFixed(2)}{" "}
                        {String(task.currency)} · Self-reported estimate
                      </p>
                    )}
                  <TaskCompletion
                    id={String(task.id)}
                    completed={Boolean(task.completed)}
                  />
                  <details>
                    <summary>Edit renewal task</summary>
                    <PlanningForm
                      kind="renewal_tasks"
                      row={task}
                      options={options}
                    />
                  </details>
                  <PlanningDelete kind="renewal_tasks" id={String(task.id)} />
                </article>
              );
            })}
          </>
        )}
      </section>
    </section>
  );
}
