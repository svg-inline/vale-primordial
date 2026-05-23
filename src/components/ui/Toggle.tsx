import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  pressed: boolean;
}

export function Toggle({ children, className = "", pressed, ...props }: ToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        "app-toggle",
        pressed ? "app-toggle--pressed" : "",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
