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
      {/* Breadcrumb Navigation */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-[13px] text-gray-400 mb-2" aria-label="Breadcrumb">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <div key={crumb.label || idx} className="flex items-center gap-2">
                {idx > 0 && <span className="text-gray-300">/</span>}
                {crumb.href && !isLast ? (
                  <Link to={crumb.href} className="hover:text-blue-600 transition">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-gray-900 font-semibold' : ''}>{crumb.label}</span>
                )}
              </div>
            );
          })}
        </nav>
      )}

      {/* Title & Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-bold text-gray-950 tracking-tight leading-tight">
            {title}
          </h1>
          {description && <p className="text-[14px] text-gray-500 mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2.5">{actions}</div>}
      </div>

      {/* Extra Header Content */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
