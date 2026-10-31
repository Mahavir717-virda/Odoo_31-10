export default function Skeleton({ className = '', height = 16, width = 'full' }) {
  const widthClass = width === 'full' ? 'w-full' : `w-[${width}]`;
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${widthClass} h-[${height}px] ${className}`}
      aria-hidden="true"
    />
  );
}
