/**
 * Server-side Validation Utilities for Shri Gajanan Hospital
 *
 * Enforces strict validation on incoming request bodies before database operations.
 */

export interface ValidationResult<T = string> {
  isValid: boolean;
  error?: string;
  value?: T;
}

/**
 * Validates a person's name (Patient, Doctor, Staff, Contact query)
 * - Must contain only alphabetic characters, spaces, hyphens, periods, or apostrophes
 * - Minimum 2 characters
 * - Strictly rejects digits and special characters (e.g. '12345', 'John@Doe')
 */
export function validateName(name: any, fieldName = 'Full Name'): ValidationResult<string> {
  if (typeof name !== 'string') {
    return { isValid: false, error: `${fieldName} must be a valid string.` };
  }
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters long.` };
  }
  if (trimmed.length > 100) {
    return { isValid: false, error: `${fieldName} cannot exceed 100 characters.` };
  }
  if (/\d/.test(trimmed)) {
    return { isValid: false, error: `${fieldName} cannot contain numbers.` };
  }
  const nameRegex = /^[a-zA-Z\u00C0-\u024F\s.'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes.` };
  }
  return { isValid: true, value: trimmed };
}
/**
 * Validates an Indian mobile number
 * - Must be exactly 10 digits
 * - Must start with 6, 7, 8, or 9
 * - Allows optional leading +91 or 91 country code prefix
 * - Strictly rejects invalid characters like '@', letters, and numbers like '45534454@4455', 'abcdefghij'
 */
export function validateMobile(phone: any, required = true): ValidationResult<string> {
  if (phone === undefined || phone === null || phone === '') {
    if (!required) return { isValid: true, value: '' };
    return { isValid: false, error: 'Mobile number is required.' };
  }
  if (typeof phone !== 'string' && typeof phone !== 'number') {
    return { isValid: false, error: 'Mobile number must be a valid string or number.' };
  }
  const raw = String(phone).trim();
  if (!raw) {
    if (!required) return { isValid: true, value: '' };
    return { isValid: false, error: 'Mobile number is required.' };
  }

  // Reject invalid symbols
  if (/[^0-9+\-\s()]/.test(raw)) {
    return { isValid: false, error: 'Mobile number contains invalid characters (numbers only).' };
  }

  let digits = raw.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.substring(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.substring(1);
  }

  if (digits.length !== 10) {
    return { isValid: false, error: 'Please enter a valid 10-digit mobile number.' };
  }

  if (!/^[6-9]/.test(digits)) {
    return { isValid: false, error: 'Indian mobile numbers must start with 6, 7, 8, or 9.' };
  }

  if (/^(\d)\1{9}$/.test(digits)) {
    return { isValid: false, error: 'Please enter a valid active mobile number.' };
  }

  return { isValid: true, value: digits };
}

/**
 * Validates an email address
 * - Strict format with valid domain name and TLD of at least 2 characters
 * - Rejects incomplete emails like 'roshan@123'
 */
export function validateEmail(email: any, required = true): ValidationResult<string> {
  if (email === undefined || email === null || email === '') {
    if (!required) return { isValid: true, value: '' };
    return { isValid: false, error: 'Email address is required.' };
  }
  if (typeof email !== 'string') {
    return { isValid: false, error: 'Email must be a valid string.' };
  }
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    if (!required) return { isValid: true, value: '' };
    return { isValid: false, error: 'Email address is required.' };
  }

  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@example.com).' };
  }

  const parts = trimmed.split('.');
  const tld = parts[parts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-z]+$/i.test(tld)) {
    return { isValid: false, error: 'Email must end with a valid domain extension like .com or .in.' };
  }

  return { isValid: true, value: trimmed };
}
/**
 * Validates age
 * - Must be a positive integer whole number between 0 and 125
 * - Strictly rejects negatives (e.g. -25), decimals, and non-numeric input
 */
export function validateAge(age: any, required = false): ValidationResult<number> {
  if (age === undefined || age === null || age === '') {
    if (!required) return { isValid: true };
    return { isValid: false, error: 'Age is required.' };
  }

  const str = String(age).trim();
  if (!/^\d+$/.test(str)) {
    return { isValid: false, error: 'Age must be a positive whole number.' };
  }

  const num = parseInt(str, 10);
  if (isNaN(num)) {
    return { isValid: false, error: 'Please enter a valid age.' };
  }
  if (num < 0 || num > 125) {
    return { isValid: false, error: 'Age must be between 0 and 125 years.' };
  }

  return { isValid: true, value: num };
}

/**
 * Validates Indian postal PIN code
 * - Exactly 6 digits
 * - Cannot start with 0
 * - Strictly rejects letters like 'abc123'
 */
export function validatePincode(pin: any, required = false): ValidationResult<string> {
  if (pin === undefined || pin === null || pin === '') {
    if (!required) return { isValid: true, value: '' };
    return { isValid: false, error: 'PIN code is required.' };
  }
  const trimmed = String(pin).trim();
  if (!trimmed) {
    if (!required) return { isValid: true, value: '' };
    return { isValid: false, error: 'PIN code is required.' };
  }

  if (!/^[1-9]\d{5}$/.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid 6-digit postal PIN code (e.g. 400092).' };
  }

  return { isValid: true, value: trimmed };
}
/**
 * Validates password
 * - Minimum 6 characters
 */
export function validatePassword(password: any, minLength = 6): ValidationResult<string> {
  if (typeof password !== 'string') {
    return { isValid: false, error: 'Password is required.' };
  }
  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters long.` };
  }
  return { isValid: true, value: password };
}

/**
 * Validates general required text
 */
export function validateRequired(val: any, fieldName = 'Field', minLength = 1): ValidationResult<string> {
  if (typeof val !== 'string') {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  const trimmed = val.trim();
  if (!trimmed || trimmed.length < minLength) {
    return { isValid: false, error: `${fieldName} is required${minLength > 1 ? ` (minimum ${minLength} characters)` : ''}.` };
  }
  return { isValid: true, value: trimmed };
}