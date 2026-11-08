"use client";
import { useActionState, useId } from "react";
import { FormFeedback } from "./form-feedback";
import { SubmitButton } from "../submit-button";
import { saveCredential } from "./actions";
type Row = Record<string, string | number | null>;
export function CredentialForm({
  kind,
  row,
}: {
  kind: "licenses" | "ce_entries" | "certifications";
  row?: Row;
}) {
  const [state, action] = useActionState(saveCredential, {});
  const formId = useId();
  const fields =
    kind === "licenses"
      ? [
          "jurisdiction",
          "license_type",
          "license_number",
          "issued_on",
          "expires_on",
        ]
      : kind === "ce_entries"
        ? ["title", "provider", "hours", "completed_on", "accreditation"]
        : ["name", "issuer", "issued_on", "expires_on"];
  return (
    <form key={state.key} action={action} className="credential-form">
      <FormFeedback state={state} successMessage="Record saved." />
      <input type="hidden" name="kind" value={kind} />
      {row && <input type="hidden" name="id" value={String(row.id)} />}
      {fields.map((field) => (
        <div key={field}>
          <label htmlFor={`${formId}-${field}`}>
            {field.replaceAll("_", " ")}
          </label>
          <input
            id={`${formId}-${field}`}
            name={field}
            aria-invalid={Boolean(state.fieldErrors?.[field])}
            aria-describedby={
              state.fieldErrors?.[field]
                ? `${formId}-${field}-error`
                : undefined
            }
            defaultValue={
              state.values?.[field] ??
              row?.[field] ??
              (field === "license_type" ? "RN" : "")
            }
            type={
              field.endsWith("_on")
                ? "date"
                : field === "hours"
                  ? "number"
                  : "text"
            }
            required={[
              "jurisdiction",
              "license_type",
              "title",
              "provider",
              "hours",
              "completed_on",
              "name",
            ].includes(field)}
            maxLength={200}
            min={field === "hours" ? "0.01" : undefined}
            max={field === "hours" ? "1000" : undefined}
            step={field === "hours" ? "0.01" : undefined}
          />
          {state.fieldErrors?.[field] && (
            <span className="field-error" id={`${formId}-${field}-error`}>
              {state.fieldErrors[field]}
            </span>
          )}
        </div>
      ))}
      {kind === "licenses" && (
        <label>
          Status
          <select
            name="status"
            defaultValue={
              state.values?.status ?? row?.status ?? "self_reported"
            }
          >
            <option value="self_reported">Self reported</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
          </select>
        </label>
      )}
      <SubmitButton>
        Save{" "}
        {kind === "ce_entries"
          ? "learning"
          : kind === "licenses"
            ? "license"
            : "certification"}
      </SubmitButton>
    </form>
  );
}
