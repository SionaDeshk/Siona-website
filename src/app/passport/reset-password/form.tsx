"use client";
import { useActionState } from "react";
import { changePassword, type PasswordState } from "./actions";
import { SubmitButton } from "../submit-button";
export function PasswordForm() {
  const [state, action] = useActionState(changePassword, {} as PasswordState);
  return (
    <form action={action}>
      <label>
        New password
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
        />
      </label>
      <label>
        Confirm new password
        <input
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
        />
      </label>
      {state.error && <p role="alert">{state.error}</p>}
      <SubmitButton pendingLabel="Updating password…">
        Update password
      </SubmitButton>
    </form>
  );
}
