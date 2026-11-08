/**
 * Form Validation Utilities for Shri Gajanan Hospital
 *
 * Provides strict validation for:
 * - Patient / Doctor / Contact Name
 * - Indian Mobile Number (10 digits starting with 6-9)
 * - Email Address (with valid domain and TLD)
 * - Age (positive integer 0-125)
 * - Postal PIN Code (6 digits)
 * - Password & Required text fields
 */

export interface ValidationResult<T = string> {
  isValid: boolean;
  error?: string;
  value?: T;
}

/**
 * Validates a person's name (Patient, Doctor, Staff, Contact person)
 * - Must contain only alphabetic characters, spaces, hyphens, periods, or apostrophes
 * - Minimum 2 characters
 * - Strictly rejects digits and special characters (e.g. '12345', 'John@Doe')
 */
export function validateName(name: string | undefined | null, fieldName = 'Full Name'): ValidationResult<string> {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: `${fieldName} must be at least 2 characters long.` };
  }
  if (trimmed.length > 100) {
    return { isValid: false, error: `${fieldName} cannot exceed 100 characters.` };
  }
  // Check for any digits
  if (/\d/.test(trimmed)) {
    return { isValid: false, error: `${fieldName} cannot contain numbers.` };
  }
  // Allow letters (including unicode accents), spaces, periods, hyphens, apostrophes
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
export function validateMobile(phone: string | undefined | null, required = true): ValidationResult<string> {
  const raw = (phone || '').trim();
  if (!raw) {
    if (!required) return { isValid: true, value: '' };
    return { isValid: false, error: 'Mobile number is required.' };
  }

  // Reject any symbols other than digits, +, -, space, parentheses
  if (/[^0-9+\-\s()]/.test(raw)) {
    return { isValid: false, error: 'Mobile number contains invalid characters (numbers only).' };
  }

  // Remove formatting characters to extract core digits
  let digits = raw.replace(/\D/g, '');

  // Handle +91 or 91 country code prefix if 12 digits
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

  // Reject repeated single digits like 0000000000 or 9999999999
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
export function validateEmail(email: string | undefined | null, required = true): ValidationResult<string> {
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed) {
    if (!required) return { isValid: true, value: '' };
    return { isValid: false, error: 'Email address is required.' };
  }

  // RFC 5322 compliant regex requiring proper TLD (e.g. .com, .org, .in)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@example.com).' };
  }

  // Check that the top-level domain has at least 2 alpha characters
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
 * - Strictly rejects negatives (e.g. -25), decimals, and letters
 */
export function validateAge(age: number | string | undefined | null, required = false): ValidationResult<number> {
  if (age === undefined || age === null || age === '') {
    if (!required) return { isValid: true };
    return { isValid: false, error: 'Age is required.' };
  }

  const str = String(age).trim();
  // Reject negative sign, decimals, or non-numeric characters
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
export function validatePincode(pin: string | undefined | null, required = false): ValidationResult<string> {
  const trimmed = (pin || '').trim();
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
export function validatePassword(password: string | undefined | null, minLength = 6): ValidationResult<string> {
  const raw = password || '';
  if (!raw) {
    return { isValid: false, error: 'Password is required.' };
  }
  if (raw.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters long.` };
  }
  return { isValid: true, value: raw };
}

/**
 * Validates general required text
 */
export function validateRequired(val: string | undefined | null, fieldName = 'Field', minLength = 1): ValidationResult<string> {
  const trimmed = (val || '').trim();
  if (!trimmed || trimmed.length < minLength) {
    return { isValid: false, error: `${fieldName} is required${minLength > 1 ? ` (minimum ${minLength} characters)` : ''}.` };
  }
  return { isValid: true, value: trimmed };
}

/**
 * Validates consultation fee
 */
export function validateFee(fee: number | string | undefined | null): ValidationResult<number> {
  const str = String(fee ?? '').trim();
  if (!str) {
    return { isValid: false, error: 'Consultation fee is required.' };
  }
  const num = Number(str);
  if (isNaN(num) || num < 0 || !Number.isFinite(num)) {
    return { isValid: false, error: 'Consultation fee must be a valid positive number.' };
  }
  return { isValid: true, value: num };
}

/**
 * Validates experience years
 */
export function validateExperience(exp: number | string | undefined | null): ValidationResult<number> {
  const str = String(exp ?? '').trim();
  if (!str) {
    return { isValid: false, error: 'Years of experience is required.' };
  }
  const num = parseInt(str, 10);
  if (isNaN(num) || num < 0 || num > 70) {
    return { isValid: false, error: 'Experience must be a whole number between 0 and 70 years.' };
  }
  return { isValid: true, value: num };
}
