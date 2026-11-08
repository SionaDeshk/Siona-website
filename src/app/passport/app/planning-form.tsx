"use client";
import { useActionState, useId } from "react";
import type { CredentialOption } from "@/lib/passport/credential-links";
import { planningFields, type PlanningRow } from "@/lib/passport/planning";
import {
  savePlanning,
  removePlanning,
  setTaskCompleted,
} from "./planning-actions";
import { FormFeedback } from "./form-feedback";
import { SubmitButton } from "../submit-button";
const labels: Record<string, string> = {
  title: "Title",
  target_hours: "Personal target hours",
  starts_on: "Period start",
  ends_on: "Period end",
  credential: "Renewal credential",
  notes: "My renewal notes",
  due_on: "Task due date",
  estimated_fee: "Estimated fee",
  currency: "Currency code",
};
export function PlanningForm({
  kind,
  row,
  options = [],
}: {
  kind: "ce_goals" | "renewal_tasks";
  row?: PlanningRow;
  options?: CredentialOption[];
}) {
  const [state, action] = useActionState(savePlanning, {});
  const id = useId();
  const initial = (field: string) =>
    field === "credential"
      ? row?.license_id
        ? `licenses:${row.license_id}`
        : row?.certification_id
          ? `certifications:${row.certification_id}`
          : ""
      : String(row?.[field] ?? (field === "currency" ? "USD" : ""));
  return (
    <form key={state.key} action={action} className="credential-form">
      <input type="hidden" name="kind" value={kind} />
      {row && <input type="hidden" name="id" value={String(row.id)} />}
      <FormFeedback
        state={state}
        successMessage={
          kind === "ce_goals" ? "Personal goal saved." : "Renewal task saved."
        }
      />
      {planningFields[kind].map((field) => (
        <div key={field}>
          <label htmlFor={`${id}-${field}`}>{labels[field]}</label>
          {field === "credential" ? (
            <select
              id={`${id}-${field}`}
              name={field}
              defaultValue={state.values?.[field] ?? initial(field)}
              required
              aria-invalid={Boolean(state.fieldErrors?.[field])}
              aria-describedby={
                state.fieldErrors?.[field] ? `${id}-${field}-error` : undefined
              }
            >
              <option value="">Choose a license or certification</option>
              {options
                .filter((option) => !option.value.startsWith("ce_entries:"))
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
            </select>
          ) : field === "notes" ? (
            <textarea
              id={`${id}-${field}`}
              name={field}
              defaultValue={state.values?.[field] ?? initial(field)}
              maxLength={1000}
              rows={3}
              aria-invalid={Boolean(state.fieldErrors?.[field])}
              aria-describedby={
                state.fieldErrors?.[field] ? `${id}-${field}-error` : undefined
              }
            />
          ) : (
            <input
              id={`${id}-${field}`}
              name={field}
              defaultValue={state.values?.[field] ?? initial(field)}
              type={
                field.endsWith("_on")
                  ? "date"
                  : ["target_hours", "estimated_fee"].includes(field)
                    ? "number"
                    : "text"
              }
              required={[
                "title",
                "target_hours",
                "starts_on",
                "ends_on",
                "currency",
              ].includes(field)}
              min={
                field === "target_hours"
                  ? "0.01"
                  : field === "estimated_fee"
                    ? "0"
                    : undefined
              }
              max={
                field === "target_hours"
                  ? "10000"
                  : field === "estimated_fee"
                    ? "1000000"
                    : undefined
              }
              step={
                ["target_hours", "estimated_fee"].includes(field)
                  ? "0.01"
                  : undefined
              }
              maxLength={field === "currency" ? 3 : 200}
              aria-invalid={Boolean(state.fieldErrors?.[field])}
              aria-describedby={
                state.fieldErrors?.[field] ? `${id}-${field}-error` : undefined
              }
            />
          )}{" "}
          {state.fieldErrors?.[field] && (
            <span className="field-error" id={`${id}-${field}-error`}>
              {state.fieldErrors[field]}
            </span>
          )}
        </div>
      ))}
      <SubmitButton>
        {kind === "ce_goals" ? "Save personal goal" : "Save renewal task"}
      </SubmitButton>
    </form>
  );
}
export function PlanningDelete({
  kind,
  id,
}: {
  kind: "ce_goals" | "renewal_tasks";
  id: string;
}) {
  const [state, action] = useActionState(removePlanning, {});
  return (
    <form action={action}>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <SubmitButton
        className="danger"
        pendingLabel="Deleting…"
        confirmText="Delete this personal planning record?"
      >
        {kind === "ce_goals" ? "Delete goal" : "Delete task"}
      </SubmitButton>
      <FormFeedback state={state} successMessage="Planning record deleted." />
    </form>
  );
}
export function TaskCompletion({
  id,
  completed,
}: {
  id: string;
  completed: boolean;
}) {
  const [state, action] = useActionState(setTaskCompleted, {});
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="completed" value={String(!completed)} />
      <SubmitButton pendingLabel="Updating…">
        {completed ? "Reopen task" : "Mark complete"}
      </SubmitButton>
      <FormFeedback state={state} successMessage="Task updated." />
    </form>
  );
}
