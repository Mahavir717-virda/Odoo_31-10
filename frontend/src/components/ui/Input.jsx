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
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
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
        className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm ${
          error
            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
        }`}
        {...rest}
      />
      {error && errorMessage && <p className="mt-1 text-sm text-red-600" role="alert">{errorMessage}</p>}
    </div>
  );
}
