"use client";
import { useActionState, useId, useState } from "react";
import type { CredentialOption } from "@/lib/passport/credential-links";
import type { FormState } from "@/lib/passport/form-state";
import { uploadDocument } from "./actions";
import { FormFeedback } from "./form-feedback";
import { SubmitButton } from "../submit-button";
export function UploadForm({ options }: { options: CredentialOption[] }) {
  // Retain the original File only in this mounted form's memory, never in
  // action state, localStorage or URLs. It can be retried after a server error.
  const [file, setFile] = useState<File | null>(null);
  const [state, action] = useActionState(
    async (previous: FormState, form: FormData) => {
      if (file) form.set("file", file);
      const result = await uploadDocument(previous, form);
      if (result.success) setFile(null);
      return result;
    },
    {},
  );
  const id = useId();
  const selected = state.values?.credential || "";
  return (
    <form key={state.key} action={action} className="credential-form">
      <FormFeedback
        state={state}
        successMessage="Document uploaded privately."
      />
      <div>
        <label htmlFor={`${id}-file`}>
          Document (PDF, PNG, JPEG · up to 4 MB)
        </label>
        <input
          id={`${id}-file`}
          type="file"
          name="file"
          accept="application/pdf,image/png,image/jpeg"
          required={!file}
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          aria-invalid={Boolean(state.fieldErrors?.file)}
          aria-describedby={`${id}-file-help${state.fieldErrors?.file ? ` ${id}-file-error` : ""}`}
        />
        <span id={`${id}-file-help`}>
          {file
            ? `Selected: ${file.name}. You can retry with this file or choose a replacement.`
            : "Choose a credential certificate. Do not include patient information."}
        </span>
        {state.fieldErrors?.file && (
          <span className="field-error" id={`${id}-file-error`}>
            {state.fieldErrors.file}
          </span>
        )}
      </div>
      <div>
        <label htmlFor={`${id}-credential`}>Link to a credential</label>
        <select
          id={`${id}-credential`}
          name="credential"
          defaultValue={selected}
          aria-invalid={Boolean(state.fieldErrors?.credential)}
          aria-describedby={
            state.fieldErrors?.credential ? `${id}-credential-error` : undefined
          }
        >
          <option value="">No linked credential</option>
          {selected && !options.some((option) => option.value === selected) && (
            <option value={selected} disabled>
              Previously selected credential is unavailable
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {state.fieldErrors?.credential && (
          <span className="field-error" id={`${id}-credential-error`}>
            {state.fieldErrors.credential}
          </span>
        )}
      </div>
      <SubmitButton pendingLabel="Uploading…">Upload privately</SubmitButton>
    </form>
  );
}
