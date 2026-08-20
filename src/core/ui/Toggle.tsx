// Shared toggle switch — used by every feature that has an on/off rule.
import "./toggle.css";

export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={`fl-toggle ${checked ? "fl-toggle--on" : ""}`}
      onClick={() => !disabled && onChange(!checked)}
    >
      <span className="fl-toggle__knob" />
    </button>
  );
}
