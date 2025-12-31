/**
 * Validation utilities for form inputs
 */

/**
 * Email validation
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Phone number validation (Turkish format)
 */
export const isValidPhoneNumber = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  // Turkish phone numbers: 10 digits starting with 5
  return /^5\d{9}$/.test(cleaned);
};

/**
 * Password strength validation
 */
export const validatePasswordStrength = (password) => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strength = [minLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar]
    .filter(Boolean).length;

  return {
    isValid: strength >= 3 && minLength,
    strength: strength,
    requirements: {
      minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    },
  };
};

/**
 * URL validation
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if value is empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Validate required field
 */
export const isRequired = (value) => {
  return !isEmpty(value);
};

/**
 * Validate min length
 */
export const minLength = (value, min) => {
  if (typeof value !== 'string') return false;
  return value.length >= min;
};

/**
 * Validate max length
 */
export const maxLength = (value, max) => {
  if (typeof value !== 'string') return false;
  return value.length <= max;
};

/**
 * Validate number range
 */
export const inRange = (value, min, max) => {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Validate positive number
 */
export const isPositive = (value) => {
  const num = Number(value);
  return !isNaN(num) && num > 0;
};

/**
 * Validate integer
 */
export const isInteger = (value) => {
  return Number.isInteger(Number(value));
};

/**
 * Validate date format (YYYY-MM-DD)
 */
export const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Validate future date
 */
export const isFutureDate = (dateString) => {
  const date = new Date(dateString);
  return date > new Date();
};

/**
 * Validate past date
 */
export const isPastDate = (dateString) => {
  const date = new Date(dateString);
  return date < new Date();
};

/**
 * Sanitize HTML to prevent XSS
 */
export const sanitizeHtml = (html) => {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
};

/**
 * Validate file size (in MB)
 */
export const isValidFileSize = (file, maxSizeMB = 5) => {
  if (!file) return false;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

/**
 * Validate file type
 */
export const isValidFileType = (file, allowedTypes = []) => {
  if (!file) return false;
  return allowedTypes.some(type => file.type.includes(type));
};
