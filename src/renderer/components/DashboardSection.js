export function DashboardSection({
  title,
  children,
  className = '',
  headerAction = null,
}) {
  return (
    <section className={`dashboard-section${className ? ` ${className}` : ''}`}>
      {title && (
        <div className="dashboard-section__header">
          <h2 className="dashboard-section__title">{title}</h2>
          {headerAction}
        </div>
      )}
      {children}
    </section>
  );
}
