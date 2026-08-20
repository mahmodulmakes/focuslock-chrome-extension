// Deliberately simple placeholder icon — per instruction, icon fidelity isn't a priority
// for this pass. Swap for a real exported asset whenever design work reaches icons.

export type IconName = "plus";

const PATHS: Record<IconName, string> = {
  plus: "M12 5v14M5 12h14",
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={PATHS[name]} />
    </svg>
  );
}
