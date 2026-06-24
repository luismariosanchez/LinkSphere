export function TagChip({ label, variant = 'default' }) {
  return (
    <span className={`tag-chip tag-chip--${variant}`}>
      {label}
    </span>
  );
}
