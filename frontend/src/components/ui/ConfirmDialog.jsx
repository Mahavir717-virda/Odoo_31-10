export default function ConfirmDialog({
  open = false,
  isOpen = false,
  onConfirm,
  onCancel,
  title = 'Confirm action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant,
  variant = 'danger',
  className = '',
}) {
  const isModalOpen = open || isOpen;
  if (!isModalOpen) {
    return null;
  }

  const resolvedVariant = confirmVariant || variant || 'danger';

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-7 shadow-xl ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <h2 id="confirm-title" className="text-[18px] font-bold text-gray-950 mb-2">
          {title}
        </h2>
        {message && <p className="text-[13px] text-gray-500 mb-6">{message}</p>}
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-[#DCE3EE] text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 rounded-xl text-[13px] font-semibold text-white transition shadow-sm ${
              resolvedVariant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-200'
                : 'bg-[#2563EB] hover:bg-[#1D4ED8] focus:ring-2 focus:ring-blue-200'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}
