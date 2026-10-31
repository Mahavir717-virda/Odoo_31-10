import { Link } from 'react-router-dom';

export default function PageHeader({
  title,
  description,
  breadcrumbs = [],
  actions = null,
  children = null,
}) {
  return (
    <div className="mb-6">
      {/* Optional Breadcrumb navigation */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-2 text-xs text-gray-500 mb-2" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={crumb.label || idx} className="flex items-center space-x-2">
                {idx > 0 && <span>/</span>}
                {crumb.href && !isLast ? (
                  <Link to={crumb.href} className="hover:text-indigo-600 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-gray-900 font-medium' : ''}>{crumb.label}</span>
                )}
              </div>
            );
          })}
        </nav>
      )}

      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        </div>
        {actions && <div className="flex items-center space-x-3">{actions}</div>}
      </div>

      {/* Extra Header Content */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

