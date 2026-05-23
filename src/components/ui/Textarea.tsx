import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  hint?: string;
  label?: string;
}

export function Textarea({
  className = "",
  error,
  hint,
  id,
  label,
  ...props
}: TextareaProps) {
  const describedBy = [
    hint && id ? `${id}-hint` : "",
    error && id ? `${id}-error` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className="app-field">
      {label ? <span className="app-field__label">{label}</span> : null}
      <textarea
        id={id}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className={cn("app-input app-textarea", className)}
        {...props}
      />
      {hint && id ? (
        <span id={`${id}-hint`} className="app-field__hint">
          {hint}
        </span>
      ) : null}
      {error && id ? (
        <span id={`${id}-error`} className="app-field__error">
          {error}
        </span>
      ) : null}
    </label>
  );
}
