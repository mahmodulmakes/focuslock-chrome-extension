// Shared modal shell — dimmed/blurred backdrop. Reused by any feature that needs a popup; the
// card itself is passed in as children. No floating close button — each card supplies its own
// Cancel/Done action, and clicking the backdrop still closes it.
import type { ComponentChildren } from "preact";
import "./modal.css";

export function Modal({ onClose, children }: { onClose: () => void; children: ComponentChildren }) {
  return (
    <div className="fl-modal-overlay" onClick={onClose}>
      <div className="fl-modal-row" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
