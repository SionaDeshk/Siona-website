"use client";
import { useActionState, useId } from "react";
import { saveProfile } from "./actions";
import { FormFeedback } from "./form-feedback";
import { SubmitButton } from "../submit-button";
export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, action] = useActionState(saveProfile, {});
  const id = useId();
  return (
    <form key={state.key} action={action} className="filter">
      <div>
        <label htmlFor={`${id}-name`}>Display name</label>
        <input
          id={`${id}-name`}
          name="display_name"
          maxLength={120}
          required
          defaultValue={state.values?.display_name ?? displayName}
          aria-invalid={Boolean(state.fieldErrors?.display_name)}
          aria-describedby={state.fieldErrors?.display_name ? id : undefined}
        />
        {state.fieldErrors?.display_name && (
          <span className="field-error" id={id}>
            {state.fieldErrors.display_name}
          </span>
        )}
      </div>
      <SubmitButton>Save profile</SubmitButton>
      <FormFeedback state={state} successMessage="Profile saved." />
    </form>
  );
}
