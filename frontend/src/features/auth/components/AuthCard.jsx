export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-[#F3F6FB] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img
          src="/logo.png"
          alt="Brightloop"
          className="mx-auto h-12 w-auto object-contain"
        />
        <h2 className="mt-6 text-2xl sm:text-[26px] font-bold text-gray-950 tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>}
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm rounded-2xl sm:px-10 border border-[#E2E8F0]">
          {children}
          {footer && <div className="mt-6 border-t border-[#EEF2F7] pt-4 text-center">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
