export function EmptyState({ title, message, className = 'empty-state empty-state--dark' }) {
  return (
    <div className={className}>
      {title && <h2>{title}</h2>}
      <p className="muted">{message}</p>
    </div>
  );
}
