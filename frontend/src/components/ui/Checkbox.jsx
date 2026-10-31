export default function Checkbox({
  id,
  label,
  checked = false,
  defaultChecked,
  disabled = false,
  error = false,
  errorMessage,
  required = false,
  onChange,
  className = '',
  ...rest
}) {
  return (
    <div className={`flex items-center gap-3 mb-3 ${className}`}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        required={required}
        aria-invalid={error || undefined}
        onChange={onChange}
        className={`rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 ${error ? 'border-red-500' : ''}`}
        {...rest}
      />
      {label && <label htmlFor={id} className="text-sm text-gray-700">{label}</label>}
      {error && errorMessage && <p className="ml-5 mt-0.5 text-sm text-red-600" role="alert">{errorMessage}</p>}
    </div>
  );
}
