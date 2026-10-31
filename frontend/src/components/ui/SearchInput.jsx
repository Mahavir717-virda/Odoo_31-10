const SEARCH_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) {
  return (
    <div className={`relative mb-4 ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400">{SEARCH_ICON}</span>
      <input
        type="search"
        value={value === undefined || value === null ? '' : value}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full pl-9 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
}
