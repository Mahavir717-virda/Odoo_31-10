import { validatePassword } from '../../../utils/passwordRules';

export default function PasswordChecklist({ password = '' }) {
  const validationResults = validatePassword(password);

  return (
    <div className="mt-2 space-y-1.5 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs">
      <p className="font-medium text-gray-700">Password requirements:</p>
      <ul className="space-y-1">
        {validationResults.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-center space-x-1.5 ${
              rule.passed ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            {rule.passed ? (
              <svg className="w-4 h-4 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="6" />
              </svg>
            )}
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

