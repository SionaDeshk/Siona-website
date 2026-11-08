"use client";
import { useEffect, useRef } from "react";
import type { FormState } from "@/lib/passport/form-state";
export function FormFeedback({
  state,
  successMessage,
}: {
  state: FormState;
  successMessage: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.fieldErrors)
      ref.current
        ?.closest("form")
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
  }, [state.key, state.fieldErrors]);
  const error =
    state.error ||
    (state.fieldErrors ? "Please correct the highlighted fields." : undefined);
  if (!error && !state.success) return null;
  return (
    <div ref={ref} className="form-feedback">
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <p role="status">{successMessage}</p>
      )}
    </div>
  );
}
