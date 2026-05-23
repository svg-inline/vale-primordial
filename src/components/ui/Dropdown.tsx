"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "./Button";
import { cn } from "@/lib/utils/cn";

export interface DropdownItem {
  danger?: boolean;
  label: string;
  onSelect: () => void;
}

interface DropdownProps {
  align?: "start" | "end";
  items: DropdownItem[];
  label: string;
}

export function Dropdown({ align = "start", items, label }: DropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`app-dropdown app-dropdown--${align}`}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {label}
        <ChevronDown size={16} aria-hidden />
      </Button>
      {open ? (
        <div className="app-dropdown__menu" role="menu">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                item.onSelect();
                setOpen(false);
              }}
              className={cn(
                "app-dropdown__item",
                item.danger ? "app-dropdown__item--danger" : "",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
