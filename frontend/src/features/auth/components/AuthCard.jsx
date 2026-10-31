export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-200">
          O
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
        {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100">
          {children}
          {footer && <div className="mt-6 border-t border-gray-100 pt-4 text-center">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

