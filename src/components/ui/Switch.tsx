import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  checked: boolean;
  description?: string;
  label: string;
}

export function Switch({
  checked,
  className = "",
  description,
  label,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        "app-switch",
        checked ? "app-switch--checked" : "",
        className,
      )}
      {...props}
    >
      <span className="app-switch__copy">
        <span className="app-switch__label">{label}</span>
        {description ? <span className="app-switch__description">{description}</span> : null}
      </span>
      <span className="app-switch__track" aria-hidden>
        <span className="app-switch__thumb" />
      </span>
    </button>
  );
}
