import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  hint?: string;
  label?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  className = "",
  error,
  hint,
  id,
  label,
  options,
  placeholder,
  ...props
}: SelectProps) {
  const describedBy = [
    hint && id ? `${id}-hint` : "",
    error && id ? `${id}-error` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className="app-field">
      {label ? <span className="app-field__label">{label}</span> : null}
      <select
        id={id}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        className={cn("app-input", className)}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
