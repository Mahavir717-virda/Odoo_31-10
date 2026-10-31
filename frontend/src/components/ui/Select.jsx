export default function Select({
  id,
  label,
  options = [],
  value,
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
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-[13px] font-semibold text-gray-700 mb-1.5">
          {label}
          {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={id}
        value={value === undefined || value === null ? '' : value}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        aria-invalid={error || undefined}
        onChange={onChange}
        className={`block w-full h-11 px-3.5 bg-white border ${
          error
            ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
            : 'border-[#CBD5E1] focus:ring-blue-100 focus:border-blue-500'
        } rounded-xl text-[14px] text-gray-900 focus:outline-none focus:ring-2 transition disabled:bg-gray-50 disabled:text-gray-500 ${className}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={String(option.value ?? option.label)} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && errorMessage && <p className="mt-1 text-[12px] text-red-600" role="alert">{errorMessage}</p>}
    </div>
  );
}
