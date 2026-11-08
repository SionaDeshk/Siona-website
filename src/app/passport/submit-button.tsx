"use client";
import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  confirmText,
  disabled,
  ...props
}: ComponentProps<"button"> & { pendingLabel?: string; confirmText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      {...props}
      type="submit"
      disabled={disabled || pending}
      aria-disabled={disabled || pending}
      onClick={(event) => {
        if (confirmText && !window.confirm(confirmText)) event.preventDefault();
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
