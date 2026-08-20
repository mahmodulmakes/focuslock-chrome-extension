// Shared button — two variants matching the Figma "Style5" (secondary) / "Style6" (primary).
import type { ComponentChildren } from "preact";
import "./button.css";

export interface ButtonProps {
  children: ComponentChildren;
  onClick?: () => void;
  variant?: "primary" | "secondary";
  type?: "button" | "submit";
  disabled?: boolean;
}

export function Button({ children, onClick, variant = "primary", type = "button", disabled }: ButtonProps) {
  return (
    <button
      type={type}
      className={`fl-btn fl-btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
