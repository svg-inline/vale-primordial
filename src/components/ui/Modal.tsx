"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";

interface ModalProps {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  onClose: () => void;
  open: boolean;
  title: string;
}

export function Modal({ actions, children, description, onClose, open, title }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="app-modal" role="presentation">
      <button className="app-modal__backdrop" onClick={onClose} aria-label="Fechar modal" />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
        aria-describedby={description ? "app-modal-description" : undefined}
        className="app-modal__dialog app-modal__dialog--md"
      >
        <header className="app-modal__header">
          <div>
            <h2 id="app-modal-title" className="app-modal__title">
              {title}
            </h2>
            {description ? (
              <p id="app-modal-description" className="app-modal__description">
                {description}
              </p>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar">
            <X size={16} aria-hidden />
          </Button>
        </header>
        <div className="app-modal__body">{children}</div>
        {actions ? <footer className="app-modal__footer">{actions}</footer> : null}
      </section>
    </div>
  );
}
