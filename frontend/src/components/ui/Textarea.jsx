export default function Textarea({
  id,
  label,
  value = '',
  defaultValue,
  placeholder = '',
  disabled = false,
  error = false,
  errorMessage,
  required = false,
  rows = 4,
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
      <textarea
        id={id}
        value={value === undefined || value === null ? '' : value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        aria-invalid={error || undefined}
        onChange={onChange}
        className={`block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
        {...rest}
      />
      {error && errorMessage && <p className="mt-1 text-sm text-red-600" role="alert">{errorMessage}</p>}
    </div>
  );
}
