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
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
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
        className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
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
      {error && errorMessage && <p className="mt-1 text-sm text-red-600" role="alert">{errorMessage}</p>}
    </div>
  );
}
