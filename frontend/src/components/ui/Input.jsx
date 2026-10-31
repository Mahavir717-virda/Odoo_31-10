export default function Input({
  id,
  label,
  type = 'text',
  value = '',
  defaultValue,
  placeholder = '',
  disabled = false,
  error = false,
  errorMessage,
  required = false,
  onChange,
  className = '',
  ...rest
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-[13px] font-semibold text-gray-700 mb-1.5">
          {label}
          {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value === undefined || value === null ? '' : value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-invalid={error || undefined}
        onChange={onChange}
        className={`block w-full h-11 px-3.5 bg-white border ${
          error
            ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
            : 'border-[#CBD5E1] focus:ring-blue-100 focus:border-blue-500'
        } rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 transition disabled:bg-gray-50 disabled:text-gray-500`}
        {...rest}
      />
      {error && errorMessage && <p className="mt-1 text-[12px] text-red-600" role="alert">{errorMessage}</p>}
    </div>
  );
}
