export const PASSWORD_RULES = [
  {
    id: 'min_length',
    label: 'At least 9 characters',
    test: (password) => (password || '').length >= 9,
  },
  {
    id: 'upper_case',
    label: 'One uppercase letter (A-Z)',
    test: (password) => /[A-Z]/.test(password || ''),
  },
  {
    id: 'lower_case',
    label: 'One lowercase letter (a-z)',
    test: (password) => /[a-z]/.test(password || ''),
  },
  {
    id: 'special_char',
    label: 'One special character',
    test: (password) => /[^A-Za-z0-9]/.test(password || ''),
  },
];

export function validatePassword(password) {
  return PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    passed: rule.test(password),
  }));
}

export function isPasswordValid(password) {
  return validatePassword(password).every((rule) => rule.passed);
}
