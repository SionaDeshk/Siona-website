"use client";
import { useActionState } from "react";
import { requestRecovery, type RecoveryState } from "./actions";
import { SubmitButton } from "../submit-button";
export function RecoveryForm({ available }: { available: boolean }) {
  const [state, action] = useActionState(requestRecovery, {} as RecoveryState);
  return (
    <form action={action}>
      {state.sent ? (
        <p role="status">
          If an account exists and the request is accepted, you’ll receive a
          password-reset email. Check spam too. Requests may be rate limited.
        </p>
      ) : (
        <>
          <label>
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              maxLength={254}
            />
          </label>
          {state.error && <p role="alert">{state.error}</p>}
          <SubmitButton disabled={!available} pendingLabel="Requesting link…">
            Send reset link
          </SubmitButton>
        </>
      )}
    </form>
  );
}
