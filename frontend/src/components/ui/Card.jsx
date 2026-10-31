export default function Card({ children, padded = true, className = '' }) {
  return (
    <div className={`rounded-lg border bg-white shadow-sm ${padded ? 'p-6' : ''} ${className}`}>
      {children}
    </div>
  );
}
