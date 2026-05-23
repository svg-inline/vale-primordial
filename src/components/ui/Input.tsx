import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  hint?: string;
  label?: string;
}

export function Input({ className = "", error, hint, id, label, ...props }: InputProps) {
  const describedBy = [
    hint && id ? `${id}-hint` : "",
    error && id ? `${id}-error` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className="app-field">
      {label ? <span className="app-field__label">{label}</span> : null}
      <input
        id={id}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className={cn("app-input", className)}
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
