import Spinner from './Spinner';

const VARIANTS = {
  primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus:ring-blue-200 shadow-sm',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-300',
  outline: 'border border-[#CBD5E1] bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-200 shadow-xs',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-200',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-200 shadow-sm',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg',
  md: 'px-4 py-2.5 text-sm font-semibold rounded-xl',
  lg: 'px-6 py-3 text-base font-semibold rounded-xl',
};

export default function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  className = '',
  onClick,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center transition focus:outline-none focus:ring-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? SIZES.md} ${className}`}
      {...rest}
    >
      {loading && <Spinner size="sm" className="mr-2 text-current" />}
      {children}
    </button>
  );
}
