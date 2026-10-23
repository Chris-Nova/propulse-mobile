// Ported from the web app (utils/validators.ts) so both apps accept and reject
// exactly the same names, emails and passwords.

export const isValidName = (name: string, key: string) => {
  const isInvalidLength = name.length < 3 || name.length > 20;
  const namePattern = /^[A-Za-z]+([ '-][A-Za-z]+)*$/;

  if (isInvalidLength) return `${key} must be between 3 - 20 characters in length`;
  if (!namePattern.test(name)) return `Oops! ${key} can’t include symbols like #, %, /`;
  return '';
};

export const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePassword = (password: string) => {
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const isLengthValid = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);

  return {
    isValid: hasNumber && hasSpecialChar && isLengthValid && hasUpperCase && hasLowerCase,
    hasSpecialChar,
    isLengthValid,
    hasLowerCase,
    hasUpperCase,
    hasNumber,
  };
};
