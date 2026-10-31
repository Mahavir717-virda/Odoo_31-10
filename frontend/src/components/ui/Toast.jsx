import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ToastContext = createContext(null);

const VARIANTS = {
  default: 'bg-white border-gray-200 text-gray-900',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  danger: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

function generateId() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(
    ({ title, description = '', variant = 'default', duration = 4000 }) => {
      const id = generateId();
      setToasts((current) => [...current, { id, title, description, variant, duration }]);
      return id;
    },
    []
  );

  const dismiss = useCallback(
    (id) => {
      setToasts((current) => current.filter((item) => item.id !== id));
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((item) => (
          <ToastItem
            key={item.id}
            id={item.id}
            title={item.title}
            description={item.description}
            variant={item.variant}
            duration={item.duration}
            onDismiss={() => dismiss(item.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastItem({ title, description, variant, duration, onDismiss }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(), duration);
    return () => window.clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 shadow-sm animate-in fade-in slide-in-from-right-2 duration-200 ${
        VARIANTS[variant] ?? VARIANTS.default
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex flex-col">
        {title && <h4 className="text-sm font-semibold">{title}</h4>}
        {description && <p className="mt-0.5 text-xs text-opacity-80">{description}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-auto flex-none rounded-md p-1 text-gray-400 hover:text-gray-600"
        aria-label="Dismiss toast"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-4 w-4" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default ToastItem;
